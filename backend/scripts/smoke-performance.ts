import assert from 'node:assert/strict'
import request from 'supertest'
import { performance } from 'node:perf_hooks'
import { app } from '../src/app'
import { connectToDatabase, disconnectDatabase } from '../src/config/db'
import { logger } from '../src/config/logger'

const timedRequest = async (label: string, fn: () => Promise<request.Response>) => {
  const start = performance.now()
  const response = await fn()
  const durationMs = Number((performance.now() - start).toFixed(2))

  return {
    label,
    status: response.status,
    durationMs,
  }
}

async function runSmokePerformance() {
  await connectToDatabase()

  try {
    const probes = await Promise.all([
      timedRequest('products.list', () => request(app).get('/api/products').query({ page: 1, limit: 20, sort: 'featured' })),
      timedRequest('products.featured', () => request(app).get('/api/products/featured')),
      timedRequest('products.filtered', () => request(app).get('/api/products').query({ page: 1, limit: 20, category: 'suculentas', sort: 'price_desc' })),
    ])

    for (const probe of probes) {
      assert.equal(probe.status, 200, `${probe.label} should return 200`)
    }

    logger.info({ probes }, 'Performance smoke test passed')
  } finally {
    await disconnectDatabase()
  }
}

runSmokePerformance().catch((error) => {
  logger.error(error, 'Performance smoke test failed')
  process.exit(1)
})
