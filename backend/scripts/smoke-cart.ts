import assert from 'node:assert/strict'
import request from 'supertest'
import { app } from '../src/app'
import { connectToDatabase, disconnectDatabase } from '../src/config/db'
import { logger } from '../src/config/logger'

async function runSmokeCart() {
  await connectToDatabase()

  try {
    const listProducts = await request(app).get('/api/products').query({ page: 1, limit: 1 })
    assert.equal(listProducts.status, 200, 'GET /api/products should return 200')

    const productId = listProducts.body.items?.[0]?._id as string | undefined
    assert.ok(productId, 'At least one product is required for cart smoke test')

    const uniqueEmail = `cart.user.${Date.now()}@example.com`
    const password = 'Password123!'

    const register = await request(app).post('/api/auth/register').send({
      name: 'Cart User',
      email: uniqueEmail,
      password,
    })

    assert.equal(register.status, 201, 'POST /api/auth/register should return 201')

    const accessToken = register.body.data.accessToken as string
    assert.ok(accessToken, 'register should return accessToken')

    const getEmptyCart = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${accessToken}`)

    assert.equal(getEmptyCart.status, 200, 'GET /api/cart should return 200')

    const addItem = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ productId, quantity: 2 })

    assert.equal(addItem.status, 200, 'POST /api/cart/items should return 200')
    assert.equal(addItem.body.data.items.length, 1, 'cart should include one item after add')

    const updateItem = await request(app)
      .patch(`/api/cart/items/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ quantity: 3 })

    assert.equal(updateItem.status, 200, 'PATCH /api/cart/items/:productId should return 200')
    assert.equal(updateItem.body.data.items[0].quantity, 3, 'cart item quantity should be updated')

    const removeItem = await request(app)
      .delete(`/api/cart/items/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`)

    assert.equal(removeItem.status, 200, 'DELETE /api/cart/items/:productId should return 200')
    assert.equal(removeItem.body.data.items.length, 0, 'cart should be empty after remove item')

    const clearCart = await request(app)
      .delete('/api/cart/clear')
      .set('Authorization', `Bearer ${accessToken}`)

    assert.equal(clearCart.status, 200, 'DELETE /api/cart/clear should return 200')
    assert.equal(clearCart.body.data.items.length, 0, 'cart should remain empty after clear')

    logger.info(
      {
        productId,
        getEmptyCartStatus: getEmptyCart.status,
        addItemStatus: addItem.status,
        updateItemStatus: updateItem.status,
        removeItemStatus: removeItem.status,
        clearCartStatus: clearCart.status,
      },
      'Cart endpoints smoke test passed',
    )
  } finally {
    await disconnectDatabase()
  }
}

runSmokeCart().catch((error) => {
  logger.error(error, 'Cart endpoints smoke test failed')
  process.exit(1)
})
