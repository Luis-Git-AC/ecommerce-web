import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { app } from '../src/app.js'
import { openApiDocument } from '../src/docs/openapi.js'

describe('Documentación de la API', () => {
  it('sirve la especificación OpenAPI', async () => {
    const response = await request(app).get('/api/openapi.json')

    expect(response.status).toBe(200)
    expect(response.body.openapi).toBe('3.1.0')
    expect(response.body.info.title).toBe('Ecommerce Web API')
  })

  it('sirve el visor interactivo', async () => {
    const response = await request(app).get('/api/docs')

    expect(response.status).toBe(200)
    expect(response.text).toContain('api-reference')
  })

  it('responde aunque la base de datos no esté disponible', async () => {
    // La documentación se monta antes del middleware de conexión a Mongo.
    const response = await request(app).get('/api/openapi.json')
    expect(response.status).toBe(200)
  })

  /**
   * Test de contrato: evita que la especificación se quede obsoleta en
   * silencio cuando se añaden rutas al servidor.
   */
  it('documenta todas las rutas registradas en Express', () => {
    const documented = new Set(Object.keys(openApiDocument.paths))

    const registered = new Set<string>()
    const stack = (app as unknown as { router?: { stack: unknown[] } }).router?.stack ?? []

    const collect = (layers: unknown[], prefix = '') => {
      for (const layer of layers as Array<{
        route?: { path: string }
        name?: string
        handle?: { stack?: unknown[] }
      }>) {
        if (layer.route?.path) {
          registered.add(prefix + layer.route.path)
          continue
        }

        if (layer.name === 'router' && layer.handle?.stack) {
          collect(layer.handle.stack, prefix)
        }
      }
    }

    collect(stack)

    // Express usa :param y OpenAPI {param}: se normaliza para comparar.
    const toOpenApi = (path: string) => path.replace(/:([A-Za-z0-9_]+)/g, '{$1}')

    // Rutas internas que no forman parte del contrato público.
    const excluded = new Set(['/openapi.json', '/docs', '/'])

    const missing = [...registered]
      .map(toOpenApi)
      .filter((path) => !excluded.has(path) && !documented.has(path))

    expect(missing, `Rutas sin documentar en openapi.ts: ${missing.join(', ')}`).toEqual([])
  })
})
