import assert from 'node:assert/strict'
import request from 'supertest'
import { app } from '../src/app'
import { connectToDatabase, disconnectDatabase } from '../src/config/db'
import { logger } from '../src/config/logger'

async function runSmokeOrders() {
  await connectToDatabase()

  try {
    const listProducts = await request(app).get('/api/products').query({ page: 1, limit: 1 })
    assert.equal(listProducts.status, 200, 'GET /api/products should return 200')

    const productId = listProducts.body.items?.[0]?._id as string | undefined
    assert.ok(productId, 'At least one product is required for orders smoke test')

    const uniqueEmail = `orders.user.${Date.now()}@example.com`
    const password = 'Password123!'

    const register = await request(app).post('/api/auth/register').send({
      name: 'Orders User',
      email: uniqueEmail,
      password,
    })
    assert.equal(register.status, 201, 'POST /api/auth/register should return 201')

    const accessToken = register.body.data.accessToken as string

    const addToCart = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ productId, quantity: 2 })

    assert.equal(addToCart.status, 200, 'POST /api/cart/items should return 200')

    const createOrder = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${accessToken}`)

    assert.equal(createOrder.status, 201, 'POST /api/orders should return 201')
    assert.equal(createOrder.body.data.status, 'pending', 'created order should start in pending state')
    assert.ok(Array.isArray(createOrder.body.data.items), 'order should include items array')
    assert.ok(createOrder.body.data.items.length > 0, 'order should include at least one item')

    const createdOrderId = createOrder.body.data.id as string

    const listOrders = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${accessToken}`)

    assert.equal(listOrders.status, 200, 'GET /api/orders should return 200')
    assert.ok(Array.isArray(listOrders.body.data.items), 'orders list should include items array')
    assert.ok(listOrders.body.data.items.some((item: { id: string }) => item.id === createdOrderId), 'orders list should include created order')

    const getOrderById = await request(app)
      .get(`/api/orders/${createdOrderId}`)
      .set('Authorization', `Bearer ${accessToken}`)

    assert.equal(getOrderById.status, 200, 'GET /api/orders/:id should return 200')
    assert.equal(getOrderById.body.data.id, createdOrderId, 'order detail should match created order')

    const cartAfterOrder = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${accessToken}`)

    assert.equal(cartAfterOrder.status, 200, 'GET /api/cart after order should return 200')
    assert.equal(cartAfterOrder.body.data.items.length, 0, 'cart should be empty after creating order')

    logger.info(
      {
        productId,
        createOrderStatus: createOrder.status,
        listOrdersStatus: listOrders.status,
        getOrderByIdStatus: getOrderById.status,
        cartAfterOrderStatus: cartAfterOrder.status,
      },
      'Orders endpoints smoke test passed',
    )
  } finally {
    await disconnectDatabase()
  }
}

runSmokeOrders().catch((error) => {
  logger.error(error, 'Orders endpoints smoke test failed')
  process.exit(1)
})
