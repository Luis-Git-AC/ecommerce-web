import assert from 'node:assert/strict'
import request from 'supertest'
import { app } from '../src/app'
import { connectToDatabase, disconnectDatabase } from '../src/config/db'
import { logger } from '../src/config/logger'

async function runSmokeContent() {
  await connectToDatabase()

  try {
    const blogList = await request(app).get('/api/blog').query({ page: 1, limit: 3 })
    assert.equal(blogList.status, 200, 'GET /api/blog should return 200')
    assert.ok(Array.isArray(blogList.body.data.items), 'GET /api/blog should return items array')
    assert.ok(blogList.body.data.items.length > 0, 'GET /api/blog should return at least one post')

    const firstSlug = blogList.body.data.items[0]?.slug
    assert.ok(firstSlug, 'Blog list should include a slug')

    const blogDetail = await request(app).get(`/api/blog/${firstSlug}`)
    assert.equal(blogDetail.status, 200, 'GET /api/blog/:slug should return 200')

    const contact = await request(app).post('/api/contact/messages').send({
      name: 'Test User',
      email: 'test.user@example.com',
      message: 'Mensaje de prueba para verificar persistencia.',
    })
    assert.equal(contact.status, 201, 'POST /api/contact/messages should return 201')

    const newsletter = await request(app).post('/api/newsletter/subscribe').send({
      email: 'newsletter@example.com',
    })
    assert.equal(newsletter.status, 201, 'POST /api/newsletter/subscribe should return 201')

    const clubLead = await request(app).post('/api/club/leads').send({
      name: 'Lead User',
      email: 'lead.user@example.com',
      plan: 'medio',
    })
    assert.equal(clubLead.status, 201, 'POST /api/club/leads should return 201')

    logger.info(
      {
        blogItems: blogList.body.data.items.length,
        blogSlug: firstSlug,
        contactStatus: contact.status,
        newsletterStatus: newsletter.status,
        clubLeadStatus: clubLead.status,
      },
      'Content endpoints smoke test passed',
    )
  } finally {
    await disconnectDatabase()
  }
}

runSmokeContent().catch((error) => {
  logger.error(error, 'Content endpoints smoke test failed')
  process.exit(1)
})
