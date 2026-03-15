import { promises as fs } from 'node:fs'
import path from 'node:path'
import { cloudinary, isCloudinaryConfigured } from '../src/config/cloudinary'
import { env } from '../src/config/env'
import { logger } from '../src/config/logger'

type ManifestFile = {
  fileName: string
  relativePath: string
  localPath: string
  role: 'card' | 'gallery'
  order: number
}

type ManifestProduct = {
  folder: string
  slug: string
  files: ManifestFile[]
}

type AssetsManifest = {
  generatedAt: string
  assetsRoot: string
  totalProducts: number
  totalFiles: number
  products: ManifestProduct[]
}

type UploadItem = {
  slug: string
  fileName: string
  role: 'card' | 'gallery'
  order: number
  publicId: string
  secureUrl: string
  width: number
  height: number
  bytes: number
  format: string
}

const OUTPUT_DIR = path.resolve(process.cwd(), 'scripts', 'output')
const MANIFEST_FILE = path.join(OUTPUT_DIR, 'ia-images-manifest.json')
const REPORT_FILE = path.join(OUTPUT_DIR, 'ia-images-cloudinary-report.json')
const PRODUCTS_IMAGES_FILE = path.join(OUTPUT_DIR, 'ia-images-product-images.json')

const sanitizeName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const slugToTitle = (slug: string) =>
  slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

async function readManifest(): Promise<AssetsManifest> {
  const content = await fs.readFile(MANIFEST_FILE, 'utf8')
  return JSON.parse(content) as AssetsManifest
}

async function run() {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary is not configured. Define CLOUDINARY_* in backend/.env before upload.')
  }

  const manifest = await readManifest()
  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  const uploadedItems: UploadItem[] = []

  for (const product of manifest.products) {
    const cloudinaryFolder = `${env.CLOUDINARY_FOLDER}/products/${product.slug}`
    logger.info({ slug: product.slug, totalFiles: product.files.length }, 'Uploading product images to Cloudinary')

    for (const file of product.files) {
      const publicId = `${product.slug}-${String(file.order).padStart(2, '0')}-${sanitizeName(file.fileName)}`

      const result = await cloudinary.uploader.upload(file.localPath, {
        folder: cloudinaryFolder,
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
        use_filename: false,
        unique_filename: false,
      })

      uploadedItems.push({
        slug: product.slug,
        fileName: file.fileName,
        role: file.role,
        order: file.order,
        publicId: result.public_id,
        secureUrl: result.secure_url,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        format: result.format,
      })
    }
  }

  const byProduct: Record<string, Array<{ url: string; alt: string; publicId: string; role: 'card' | 'gallery'; order: number }>> = {}

  for (const item of uploadedItems) {
    const current = byProduct[item.slug] ?? []
    current.push({
      url: item.secureUrl,
      alt: `${slugToTitle(item.slug)} imagen ${item.order}`,
      publicId: item.publicId,
      role: item.role,
      order: item.order,
    })

    current.sort((a, b) => a.order - b.order)
    byProduct[item.slug] = current
  }

  const report = {
    generatedAt: new Date().toISOString(),
    cloudinaryFolderBase: `${env.CLOUDINARY_FOLDER}/products`,
    totalUploaded: uploadedItems.length,
    items: uploadedItems,
  }

  await fs.writeFile(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  await fs.writeFile(PRODUCTS_IMAGES_FILE, `${JSON.stringify(byProduct, null, 2)}\n`, 'utf8')

  logger.info(
    {
      totalUploaded: uploadedItems.length,
      reportPath: REPORT_FILE,
      productsImagesPath: PRODUCTS_IMAGES_FILE,
    },
    'Cloudinary upload completed for IA assets',
  )
}

run().catch((error) => {
  logger.error(error, 'IA assets upload to Cloudinary failed')
  process.exit(1)
})
