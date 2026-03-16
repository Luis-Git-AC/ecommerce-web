import assert from 'node:assert/strict'
import request from 'supertest'
import { app } from '../src/app'
import { connectToDatabase, disconnectDatabase } from '../src/config/db'
import { logger } from '../src/config/logger'

async function runSmokeAuth() {
  await connectToDatabase()

  try {
    const uniqueEmail = `auth.user.${Date.now()}@example.com`
    const password = 'Password123!'

    const register = await request(app).post('/api/auth/register').send({
      name: 'Auth User',
      email: uniqueEmail,
      password,
    })

    assert.equal(register.status, 201, 'POST /api/auth/register should return 201')
    assert.ok(register.body.data.accessToken, 'register should return accessToken')
    assert.ok(register.body.data.refreshToken, 'register should return refreshToken')

    const login = await request(app).post('/api/auth/login').send({
      email: uniqueEmail,
      password,
    })

    assert.equal(login.status, 200, 'POST /api/auth/login should return 200')
    assert.ok(login.body.data.accessToken, 'login should return accessToken')
    assert.ok(login.body.data.refreshToken, 'login should return refreshToken')

    const refreshToken = login.body.data.refreshToken as string

    const refresh = await request(app).post('/api/auth/refresh').send({
      refreshToken,
    })

    assert.equal(refresh.status, 200, 'POST /api/auth/refresh should return 200')
    assert.ok(refresh.body.data.accessToken, 'refresh should return accessToken')
    assert.ok(refresh.body.data.refreshToken, 'refresh should return refreshToken')

    const logout = await request(app).post('/api/auth/logout').send({
      refreshToken: refresh.body.data.refreshToken,
    })

    assert.equal(logout.status, 200, 'POST /api/auth/logout should return 200')
    assert.equal(logout.body.data.success, true, 'logout should return success=true')

    logger.info(
      {
        registerStatus: register.status,
        loginStatus: login.status,
        refreshStatus: refresh.status,
        logoutStatus: logout.status,
      },
      'Auth endpoints smoke test passed',
    )
  } finally {
    await disconnectDatabase()
  }
}

runSmokeAuth().catch((error) => {
  logger.error(error, 'Auth endpoints smoke test failed')
  process.exit(1)
})
