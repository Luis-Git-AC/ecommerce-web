import { Router } from 'express'
import helmet from 'helmet'
import { env } from '../config/env.js'
import { openApiDocument } from './openapi.js'

export const docsRouter = Router()

docsRouter.get('/openapi.json', (_req, res) => {
  res.status(200).json(openApiDocument)
})

const docsCsp = helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'"],
  },
})

const docsPage = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Ecommerce Web API — Documentación</title>
    <style>
      body { margin: 0; }
    </style>
  </head>
  <body>
    <script id="api-reference" data-url="${env.API_PREFIX}/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
`

docsRouter.get('/docs', docsCsp, (_req, res) => {
  res.status(200).type('html').send(docsPage)
})
