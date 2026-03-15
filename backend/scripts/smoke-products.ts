import assert from 'node:assert/strict'
import request from 'supertest'
import { app } from '../src/app'
import { connectToDatabase, disconnectDatabase } from '../src/config/db'
import { logger } from '../src/config/logger'

async function runSmokeTest() {
  await connectToDatabase()

  try {
    const listResponse = await request(app).get('/api/products').query({ page: 1, limit: 5, sort: 'featured' })
    assert.equal(listResponse.status, 200, 'GET /api/products should return 200')
    assert.ok(Array.isArray(listResponse.body.items), 'GET /api/products should return items array')
    assert.ok(listResponse.body.items.length > 0, 'GET /api/products should return at least one product')

    const firstProductId = listResponse.body.items[0]?._id
    assert.ok(firstProductId, 'Seeded products must include _id')

    const detailResponse = await request(app).get(`/api/products/${firstProductId}`)
    assert.equal(detailResponse.status, 200, 'GET /api/products/:id should return 200')

    const featuredResponse = await request(app).get('/api/products/featured')
    assert.equal(featuredResponse.status, 200, 'GET /api/products/featured should return 200')
    assert.ok(Array.isArray(featuredResponse.body), 'GET /api/products/featured should return array')

    const relatedResponse = await request(app).get(`/api/products/related/${firstProductId}`)
    assert.equal(relatedResponse.status, 200, 'GET /api/products/related/:id should return 200')
    assert.ok(Array.isArray(relatedResponse.body), 'GET /api/products/related/:id should return array')

    logger.info(
      {
        listCount: listResponse.body.items.length,
        featuredCount: featuredResponse.body.length,
        relatedCount: relatedResponse.body.length,
      },
      'Products endpoints smoke test passed',
    )
  } finally {
    await disconnectDatabase()
  }
}

runSmokeTest().catch((error) => {
  logger.error(error, 'Products endpoints smoke test failed')
  process.exit(1)
})
