import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Genera public/sitemap.xml y sincroniza la línea Sitemap: de robots.txt.
 *
 * Consulta la API para incluir productos y artículos del blog. Es
 * deliberadamente TOLERANTE A FALLOS: si la API no responde (caso habitual en
 * CI o en un build sin backend levantado) genera solo las rutas estáticas y
 * avisa, pero nunca tumba el build.
 */

const SITE_URL = (process.env.VITE_SITE_URL || 'http://localhost:5173').replace(/\/$/, '')
const API_BASE_URL = (process.env.VITE_API_BASE_URL || 'http://localhost:4000/api').replace(
  /\/$/,
  '',
)
const FETCH_TIMEOUT_MS = 5000

const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/shop', changefreq: 'daily', priority: '0.9' },
  { path: '/blog', changefreq: 'weekly', priority: '0.7' },
  { path: '/club', changefreq: 'monthly', priority: '0.6' },
  { path: '/about', changefreq: 'monthly', priority: '0.5' },
  { path: '/contact', changefreq: 'monthly', priority: '0.5' },
  { path: '/help', changefreq: 'monthly', priority: '0.4' },
  { path: '/shipping', changefreq: 'monthly', priority: '0.4' },
  { path: '/legal/privacy', changefreq: 'yearly', priority: '0.2' },
  { path: '/legal/terms', changefreq: 'yearly', priority: '0.2' },
  { path: '/legal/cookies', changefreq: 'yearly', priority: '0.2' },
]

const escapeXml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

const fetchJson = async (url) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    return await response.json()
  } finally {
    clearTimeout(timeout)
  }
}

const fetchDynamicRoutes = async () => {
  const routes = []
  const warnings = []

  try {
    const products = await fetchJson(`${API_BASE_URL}/products?limit=50`)
    for (const product of products.items ?? []) {
      if (product.slug) {
        routes.push({
          path: `/product/${product.slug}`,
          changefreq: 'weekly',
          priority: '0.8',
          lastmod: product.updatedAt,
        })
      }
    }
  } catch (error) {
    warnings.push(`productos (${error.message})`)
  }

  try {
    const blog = await fetchJson(`${API_BASE_URL}/blog?limit=20`)
    for (const post of blog.data?.items ?? []) {
      if (post.slug) {
        routes.push({
          path: `/blog/${post.slug}`,
          changefreq: 'monthly',
          priority: '0.6',
          lastmod: post.publishedAt,
        })
      }
    }
  } catch (error) {
    warnings.push(`blog (${error.message})`)
  }

  return { routes, warnings }
}

const buildXml = (routes) => {
  const entries = routes
    .map((route) => {
      const lastmod = route.lastmod
        ? `\n    <lastmod>${new Date(route.lastmod).toISOString().slice(0, 10)}</lastmod>`
        : ''

      return `  <url>
    <loc>${escapeXml(`${SITE_URL}${route.path}`)}</loc>${lastmod}
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`
}

const syncRobots = async (publicDir) => {
  const robotsPath = path.join(publicDir, 'robots.txt')

  try {
    const current = await fs.readFile(robotsPath, 'utf8')
    const next = current.replace(/^Sitemap:.*$/m, `Sitemap: ${SITE_URL}/sitemap.xml`)

    if (next !== current) {
      await fs.writeFile(robotsPath, next)
      console.log(`robots.txt: Sitemap actualizado a ${SITE_URL}/sitemap.xml`)
    }
  } catch {
    console.warn('robots.txt no encontrado: se omite la sincronización.')
  }
}

const run = async () => {
  const publicDir = path.join(process.cwd(), 'public')
  const { routes: dynamicRoutes, warnings } = await fetchDynamicRoutes()
  const routes = [...STATIC_ROUTES, ...dynamicRoutes]

  await fs.mkdir(publicDir, { recursive: true })
  await fs.writeFile(path.join(publicDir, 'sitemap.xml'), buildXml(routes))
  await syncRobots(publicDir)

  console.log(
    `sitemap.xml generado con ${routes.length} URLs (${STATIC_ROUTES.length} estáticas, ${dynamicRoutes.length} dinámicas).`,
  )

  if (warnings.length > 0) {
    console.warn(
      `Aviso: no se pudo consultar ${warnings.join(' ni ')}. ` +
        'El sitemap incluye solo las rutas estáticas. ' +
        'Vuelve a generarlo con la API en marcha antes de desplegar.',
    )
  }
}

// Nunca debe romper el build: cualquier fallo se reporta y se sale con 0.
run().catch((error) => {
  console.warn(`No se pudo generar el sitemap: ${error.message}. Se continúa con el build.`)
})
