import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../src/app'
import { connectToDatabase, disconnectDatabase } from '../src/config/db'

describe('Auth integration', () => {
  beforeAll(async () => {
    await connectToDatabase()
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  it('register/login/refresh/logout flow works', async () => {
    const email = `test.auth.${Date.now()}@example.com`
    const password = 'Password123!'

    const register = await request(app).post('/api/auth/register').send({
      name: 'Auth Test',
      email,
      password,
    })

    expect(register.status).toBe(201)
    expect(register.body.data.user.email).toBe(email)
    expect(typeof register.body.data.accessToken).toBe('string')
    expect(typeof register.body.data.refreshToken).toBe('string')

    const login = await request(app).post('/api/auth/login').send({
      email,
      password,
    })

    expect(login.status).toBe(200)
    expect(typeof login.body.data.accessToken).toBe('string')
    expect(typeof login.body.data.refreshToken).toBe('string')

    const refresh = await request(app).post('/api/auth/refresh').send({
      refreshToken: login.body.data.refreshToken,
    })

    expect(refresh.status).toBe(200)
    expect(typeof refresh.body.data.accessToken).toBe('string')
    expect(typeof refresh.body.data.refreshToken).toBe('string')

    const logout = await request(app).post('/api/auth/logout').send({
      refreshToken: refresh.body.data.refreshToken,
    })

    expect(logout.status).toBe(200)
    expect(logout.body.data.success).toBe(true)
  })

  it('rejects invalid credentials', async () => {
    const email = `test.invalid.${Date.now()}@example.com`
    const password = 'Password123!'

    const register = await request(app).post('/api/auth/register').send({
      name: 'Auth Invalid',
      email,
      password,
    })

    expect(register.status).toBe(201)

    const invalidLogin = await request(app).post('/api/auth/login').send({
      email,
      password: 'WrongPassword123!',
    })

    expect(invalidLogin.status).toBe(401)
  })
})
