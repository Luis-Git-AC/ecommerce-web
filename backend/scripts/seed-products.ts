import { promises as fs } from 'node:fs'
import path from 'node:path'
import { connectToDatabase, disconnectDatabase } from '../src/config/db'
import { logger } from '../src/config/logger'
import { ProductModel } from '../src/modules/products/schemas/product.schema'

type SeedProduct = {
  slug: string
  name: string
  description: string
  price: number
  currency: string
  category: string
  careLevel: string
  lightLevel: string
  size: string
  petFriendly: boolean
  isFeatured: boolean
  images: Array<{ url: string; alt: string; publicId?: string }>
  tags: string[]
}

type CloudinaryProductImage = {
  url: string
  alt: string
  publicId: string
  role: 'card' | 'gallery'
  order: number
}

type CloudinaryImagesMap = Record<string, CloudinaryProductImage[]>

const CLOUDINARY_IMAGES_FILE = path.resolve(process.cwd(), 'scripts', 'output', 'ia-images-product-images.json')

const seedSlugToIaSlug: Record<string, string> = {
  'aloe-vera': 'aloes',
  zamioculcas: 'zamioculcas',
  'monstera-deliciosa': 'monstera',
  kalanchoe: 'kalanchoe',
  'epipremnum-aureum': 'epipremnum',
  haworthia: 'haworthia',
  'echeveria-elegans': 'echeveria',
  'crassula-ovata': 'crassula',
  'curio-rowleyanus': 'curio',
  lithops: 'lithops',
}

const seededProducts: SeedProduct[] = [
  {
    slug: 'aloe-vera',
    name: 'Aloe Vera',
    description: 'Suculenta resistente ideal para interiores bien iluminados.',
    price: 55000,
    currency: 'COP',
    category: 'suculentas',
    careLevel: 'easy',
    lightLevel: 'high',
    size: 'm',
    petFriendly: false,
    isFeatured: true,
    images: [
      { url: 'https://images.unsplash.com/photo-1459156212016-c812468e2115?auto=format&fit=crop&w=1200&q=80', alt: 'Aloe vera en maceta blanca' },
    ],
    tags: ['interior', 'suculenta', 'bajo-riego'],
  },
  {
    slug: 'zamioculcas',
    name: 'Zamioculcas',
    description: 'Planta elegante de bajo mantenimiento, perfecta para oficina.',
    price: 89000,
    currency: 'COP',
    category: 'interior',
    careLevel: 'easy',
    lightLevel: 'low',
    size: 'l',
    petFriendly: false,
    isFeatured: true,
    images: [
      { url: 'https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=1200&q=80', alt: 'Zamioculcas en espacio interior moderno' },
    ],
    tags: ['interior', 'hoja-verde', 'bajo-mantenimiento'],
  },
  {
    slug: 'monstera-deliciosa',
    name: 'Monstera Deliciosa',
    description: 'Icono tropical para dar volumen y estilo a cualquier espacio.',
    price: 120000,
    currency: 'COP',
    category: 'interior',
    careLevel: 'medium',
    lightLevel: 'medium',
    size: 'xl',
    petFriendly: false,
    isFeatured: true,
    images: [
      { url: 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=1200&q=80', alt: 'Monstera deliciosa con hojas grandes' },
    ],
    tags: ['tropical', 'interior', 'decorativa'],
  },
  {
    slug: 'kalanchoe',
    name: 'Kalanchoe',
    description: 'Suculenta con floracion colorida para espacios luminosos.',
    price: 42000,
    currency: 'COP',
    category: 'florales',
    careLevel: 'easy',
    lightLevel: 'high',
    size: 's',
    petFriendly: false,
    isFeatured: false,
    images: [
      { url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1200&q=80', alt: 'Kalanchoe florecida en maceta' },
    ],
    tags: ['suculenta', 'flor', 'balcon'],
  },
  {
    slug: 'epipremnum-aureum',
    name: 'Epipremnum Aureum',
    description: 'Enredadera versatil para repisas o macetas colgantes.',
    price: 68000,
    currency: 'COP',
    category: 'interior',
    careLevel: 'easy',
    lightLevel: 'medium',
    size: 'm',
    petFriendly: false,
    isFeatured: true,
    images: [
      { url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1200&q=80', alt: 'Epipremnum en maceta colgante' },
    ],
    tags: ['enredadera', 'interior', 'colgante'],
  },
  {
    slug: 'haworthia',
    name: 'Haworthia',
    description: 'Planta compacta ideal para escritorios y espacios pequenos.',
    price: 39000,
    currency: 'COP',
    category: 'suculentas',
    careLevel: 'easy',
    lightLevel: 'medium',
    size: 's',
    petFriendly: true,
    isFeatured: false,
    images: [
      { url: 'https://images.unsplash.com/photo-1459156212016-c812468e2115?auto=format&fit=crop&w=1200&q=80', alt: 'Haworthia en maceta de barro' },
    ],
    tags: ['suculenta', 'compacta', 'escritorio'],
  },
  {
    slug: 'echeveria-elegans',
    name: 'Echeveria Elegans',
    description: 'Roseta suculenta de gran valor ornamental.',
    price: 36000,
    currency: 'COP',
    category: 'suculentas',
    careLevel: 'easy',
    lightLevel: 'high',
    size: 's',
    petFriendly: true,
    isFeatured: false,
    images: [
      { url: 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=1200&q=80', alt: 'Echeveria en primer plano' },
    ],
    tags: ['suculenta', 'roseta', 'decoracion'],
  },
  {
    slug: 'crassula-ovata',
    name: 'Crassula Ovata',
    description: 'Conocida como arbol de jade, resistente y de crecimiento lento.',
    price: 47000,
    currency: 'COP',
    category: 'suculentas',
    careLevel: 'easy',
    lightLevel: 'high',
    size: 'm',
    petFriendly: false,
    isFeatured: false,
    images: [
      { url: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80', alt: 'Crassula ovata en maceta minimalista' },
    ],
    tags: ['jade', 'suculenta', 'interior'],
  },
  {
    slug: 'curio-rowleyanus',
    name: 'Curio Rowleyanus',
    description: 'Planta colgante de aspecto unico, ideal para altura.',
    price: 62000,
    currency: 'COP',
    category: 'colgantes',
    careLevel: 'medium',
    lightLevel: 'high',
    size: 'm',
    petFriendly: false,
    isFeatured: false,
    images: [
      { url: 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=1200&q=80', alt: 'Curio rowleyanus colgante' },
    ],
    tags: ['colgante', 'suculenta', 'decorativa'],
  },
  {
    slug: 'lithops',
    name: 'Lithops',
    description: 'Mini suculenta conocida como piedra viva.',
    price: 34000,
    currency: 'COP',
    category: 'suculentas',
    careLevel: 'medium',
    lightLevel: 'high',
    size: 'xs',
    petFriendly: true,
    isFeatured: false,
    images: [
      { url: 'https://images.unsplash.com/photo-1459156212016-c812468e2115?auto=format&fit=crop&w=1200&q=80', alt: 'Lithops en maceta pequena' },
    ],
    tags: ['piedra-viva', 'coleccion', 'suculenta'],
  },
]

async function readCloudinaryImagesMap(): Promise<CloudinaryImagesMap | null> {
  try {
    const content = await fs.readFile(CLOUDINARY_IMAGES_FILE, 'utf8')
    return JSON.parse(content) as CloudinaryImagesMap
  } catch (error) {
    logger.warn(
      {
        filePath: CLOUDINARY_IMAGES_FILE,
        error: error instanceof Error ? error.message : 'unknown-error',
      },
      'Cloudinary images map not found. Seed will keep fallback URLs',
    )
    return null
  }
}

function applyCloudinaryImages(products: SeedProduct[], cloudinaryMap: CloudinaryImagesMap | null): SeedProduct[] {
  if (!cloudinaryMap) {
    return products
  }

  return products.map((product) => {
    const iaSlug = seedSlugToIaSlug[product.slug]
    const cloudinaryImages = iaSlug ? cloudinaryMap[iaSlug] : undefined

    if (!cloudinaryImages || cloudinaryImages.length === 0) {
      return product
    }

    return {
      ...product,
      images: cloudinaryImages
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((image) => ({
          url: image.url,
          alt: image.alt,
          publicId: image.publicId,
        })),
    }
  })
}

async function runSeed() {
  const cloudinaryMap = await readCloudinaryImagesMap()
  const productsToSeed = applyCloudinaryImages(seededProducts, cloudinaryMap)

  await connectToDatabase()

  try {
    const operations = productsToSeed.map((product) => ({
      replaceOne: {
        filter: { slug: product.slug },
        replacement: product,
        upsert: true,
      },
    }))

    const result = await ProductModel.bulkWrite(operations, { ordered: false })

    const totalProducts = await ProductModel.countDocuments({})
    logger.info({
      upserted: result.upsertedCount,
      modified: result.modifiedCount,
      matched: result.matchedCount,
      totalProducts,
      cloudinaryMapLoaded: Boolean(cloudinaryMap),
    }, 'Products seed completed')
  } finally {
    await disconnectDatabase()
  }
}

runSeed().catch((error) => {
  logger.error(error, 'Products seed failed')
  process.exit(1)
})
