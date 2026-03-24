import assert from 'node:assert/strict'
import request from 'supertest'
import { app } from '../src/app'
import { connectToDatabase, disconnectDatabase } from '../src/config/db'
import { logger } from '../src/config/logger'

async function runSmokeDemoReadiness() {
  await connectToDatabase()

  try {
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@ecommerce.local',
        password: 'Admin12345!',
      })

    assert.equal(adminLogin.status, 200, 'Admin login should return 200')
    const adminToken = adminLogin.body.data.accessToken as string
    assert.ok(adminToken, 'Admin access token should exist')

    const adminUsers = await request(app)
      .get('/api/admin/users?page=1&limit=20')
      .set('Authorization', `Bearer ${adminToken}`)

    assert.equal(adminUsers.status, 200, 'Admin users should return 200')
    const users = adminUsers.body.data.items as Array<{ email: string }>
    assert.ok(users.some((user) => user.email === 'demo.customer@ecommerce.local'), 'Demo customer should exist')

    const adminOrders = await request(app)
      .get('/api/admin/orders?page=1&limit=20')
      .set('Authorization', `Bearer ${adminToken}`)

    assert.equal(adminOrders.status, 200, 'Admin orders should return 200')
    const orders = adminOrders.body.data.items as Array<{ status: string; currency: string }>
    assert.ok(orders.some((order) => order.status === 'paid' && order.currency === 'EUR'), 'Paid EUR order should exist')
    assert.ok(orders.some((order) => order.status === 'failed' && order.currency === 'EUR'), 'Failed EUR order should exist')

    logger.info(
      {
        usersCount: users.length,
        ordersCount: orders.length,
      },
      'Demo readiness smoke test passed',
    )
  } finally {
    await disconnectDatabase()
  }
}

runSmokeDemoReadiness().catch((error) => {
  logger.error(error, 'Demo readiness smoke test failed')
  process.exit(1)
})
