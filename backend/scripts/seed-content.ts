import { connectToDatabase, disconnectDatabase } from '../src/config/db'
import { logger } from '../src/config/logger'
import { BlogPostModel } from '../src/modules/content/schemas/blog-post.schema'

type SeedBlogPost = {
  slug: string
  title: string
  category: 'Cuidados' | 'Diseño' | 'Problemas comunes'
  excerpt: string
  content: string
  image: string
  publishedAt: Date
}

const blogPosts: SeedBlogPost[] = [
  {
    slug: 'como-regar-suculentas-sin-pasarte',
    title: 'Cómo regar suculentas sin pasarte',
    category: 'Cuidados',
    excerpt: 'Un método simple para saber cuándo regar y evitar hojas blandas o podridas.',
    content:
      'Regar suculentas no se trata de frecuencia fija. Revisa siempre el sustrato antes de regar, usa maceta con drenaje y prioriza riegos profundos pero espaciados.',
    image: 'https://images.unsplash.com/photo-1459664018906-085c36f472af?auto=format&fit=crop&w=900&q=80',
    publishedAt: new Date('2026-02-12T10:00:00.000Z'),
  },
  {
    slug: 'luz-natural-como-medirla-en-casa',
    title: 'Luz natural: cómo medirla en casa',
    category: 'Cuidados',
    excerpt: 'Aprende a identificar si tu espacio tiene luz baja, media o alta sin instrumentos.',
    content:
      'Observa cuántas horas de luz directa recibe cada zona, la intensidad de las sombras y el recorrido del sol. Así puedes ubicar cada planta en el sitio correcto.',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80',
    publishedAt: new Date('2026-02-05T10:00:00.000Z'),
  },
  {
    slug: 'plantas-que-transforman-un-rincon-pequeno',
    title: 'Plantas que transforman un rincón pequeño',
    category: 'Diseño',
    excerpt: 'Ideas sencillas para sumar verde sin saturar el espacio.',
    content:
      'Combina alturas y texturas. Una planta de piso, otra colgante y una mini en repisa pueden crear profundidad visual sin perder orden.',
    image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80',
    publishedAt: new Date('2026-01-29T10:00:00.000Z'),
  },
  {
    slug: 'hojas-amarillas-causas-y-soluciones-rapidas',
    title: 'Hojas amarillas: causas y soluciones rápidas',
    category: 'Problemas comunes',
    excerpt: 'Las razones más frecuentes y cómo corregirlas sin perder tu planta.',
    content:
      'El amarillamiento suele indicar exceso de agua, falta de luz o cambio brusco de temperatura. Identifica el patrón antes de actuar para no estresar la planta.',
    image: 'https://images.unsplash.com/photo-1422568374078-27d3842ba676?auto=format&fit=crop&w=900&q=80',
    publishedAt: new Date('2026-01-22T10:00:00.000Z'),
  },
]

async function runSeedContent() {
  await connectToDatabase()

  try {
    const operations = blogPosts.map((post) => ({
      replaceOne: {
        filter: { slug: post.slug },
        replacement: post,
        upsert: true,
      },
    }))

    const result = await BlogPostModel.bulkWrite(operations, { ordered: false })
    const total = await BlogPostModel.countDocuments({})

    logger.info(
      {
        upserted: result.upsertedCount,
        modified: result.modifiedCount,
        matched: result.matchedCount,
        total,
      },
      'Content seed completed',
    )
  } finally {
    await disconnectDatabase()
  }
}

runSeedContent().catch((error) => {
  logger.error(error, 'Content seed failed')
  process.exit(1)
})
