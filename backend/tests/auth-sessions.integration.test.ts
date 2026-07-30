import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../src/app.js'
import { connectToDatabase, disconnectDatabase } from '../src/config/db.js'
import { UserModel } from '../src/modules/auth/schemas/user.schema.js'

const suffix = `ses${Date.now()}`

const registerUser = async (label: string) => {
  const email = `test.session.${label}.${suffix}@example.com`
  const response = await request(app)
    .post('/api/auth/register')
    .send({ name: `Sesion ${label}`, email, password: 'Password123!' })

  expect(response.status).toBe(201)
  return { email, password: 'Password123!', data: response.body.data }
}

const login = async (email: string) => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'Password123!' })

  expect(response.status).toBe(200)
  return response.body.data
}

describe('Sesiones y tokenVersion', () => {
  beforeAll(async () => {
    await connectToDatabase()
  })

  afterAll(async () => {
    await UserModel.deleteMany({ email: { $regex: `${suffix}@example.com$` } })
    await disconnectDatabase()
  })

  it('mantiene vivas varias sesiones simultaneas', async () => {
    const { email, data: first } = await registerUser('multi')
    const second = await login(email)

    // Ambos dispositivos siguen operativos: antes el segundo login borraba el
    // unico refreshTokenHash y expulsaba silenciosamente al primero.
    const firstStillWorks = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${first.accessToken}`)
    expect(firstStillWorks.status).toBe(200)

    const secondWorks = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${second.accessToken}`)
    expect(secondWorks.status).toBe(200)

    const profile = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${second.accessToken}`)
    expect(profile.status).toBe(200)
    expect(profile.body.data.activeSessions).toBe(2)
  })

  it('limita el numero de sesiones simultaneas a 5', async () => {
    const { email, data } = await registerUser('limite')

    for (let i = 0; i < 6; i += 1) {
      await login(email)
    }

    const profile = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${data.accessToken}`)

    // El access token del registro sigue siendo valido (misma tokenVersion),
    // pero su sesion de refresh ya ha sido expulsada por antiguedad.
    expect(profile.status).toBe(200)
    expect(profile.body.data.activeSessions).toBe(5)
  })

  it('rota el refresh token e invalida el anterior', async () => {
    const { email } = await registerUser('rota')
    const session = await login(email)

    const refreshed = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: session.refreshToken })

    expect(refreshed.status).toBe(200)
    expect(refreshed.body.data.refreshToken).not.toBe(session.refreshToken)
  })

  it('detecta la reutilizacion de un refresh token y revoca todas las sesiones', async () => {
    const { email } = await registerUser('reuso')
    const session = await login(email)

    const firstRefresh = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: session.refreshToken })
    expect(firstRefresh.status).toBe(200)

    // Reutilizar el token ya rotado: firma valida, hash no registrado.
    const replay = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: session.refreshToken })
    expect(replay.status).toBe(401)

    // La respuesta legitima anterior tambien queda revocada.
    const afterRevoke = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: firstRefresh.body.data.refreshToken })
    expect(afterRevoke.status).toBe(401)

    // tokenVersion sube una vez por cada intento con un token no registrado
    // (aqui dos: el replay y el token legitimo ya revocado). Lo que importa es
    // la propiedad de seguridad, no el numero exacto.
    const user = await UserModel.findOne({ email }).lean()
    expect(user?.tokenVersion).toBeGreaterThanOrEqual(1)
    expect(user?.refreshTokens).toHaveLength(0)
  })

  it('invalida los access tokens vigentes al aumentar tokenVersion', async () => {
    const { email, data } = await registerUser('version')

    const before = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${data.accessToken}`)
    expect(before.status).toBe(200)

    await UserModel.updateOne({ email }, { $inc: { tokenVersion: 1 } })

    const after = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${data.accessToken}`)
    expect(after.status).toBe(401)
    expect(after.body.message).toContain('sesión ha caducado')
  })

  it('logout cierra solo la sesion indicada', async () => {
    const { email, data: first } = await registerUser('logout')
    const second = await login(email)

    const logout = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: first.refreshToken })
    expect(logout.status).toBe(200)

    // La otra sesion sigue pudiendo renovarse.
    const stillValid = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: second.refreshToken })
    expect(stillValid.status).toBe(200)
  })

  it('logout-all cierra todas las sesiones', async () => {
    const { email, data: first } = await registerUser('logoutall')
    const second = await login(email)

    const logoutAll = await request(app)
      .post('/api/auth/logout-all')
      .set('Authorization', `Bearer ${second.accessToken}`)
    expect(logoutAll.status).toBe(200)

    const refreshAttempt = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: first.refreshToken })
    expect(refreshAttempt.status).toBe(401)

    const accessAttempt = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${second.accessToken}`)
    expect(accessAttempt.status).toBe(401)
  })

  it('GET /auth/me devuelve el perfil del usuario autenticado', async () => {
    const { email, data } = await registerUser('perfil')

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${data.accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.data).toMatchObject({ email, role: 'user' })
  })

  it('GET /auth/me exige autenticacion', async () => {
    const response = await request(app).get('/api/auth/me')
    expect(response.status).toBe(401)
  })
})
