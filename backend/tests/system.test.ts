import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { app } from '../src/app'

describe('System routes', () => {
  it('returns 200 for /api/health', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
  })

  it('returns 503 for /api/ready if DB is disconnected', async () => {
    const response = await request(app).get('/api/ready')

    expect(response.status).toBe(503)
    expect(response.body.database).toBe('disconnected')
  })
})
