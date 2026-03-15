import { promises as fs } from 'node:fs'
import path from 'node:path'
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

const FRONTEND_IA_ASSETS_DIR = path.resolve(process.cwd(), '..', 'frontend', 'src', 'assets', 'imagenes_ia')
const OUTPUT_DIR = path.resolve(process.cwd(), 'scripts', 'output')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'ia-images-manifest.json')

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp'])

const toSlug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/_ia$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

async function listImageFiles(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true })

  const fileNames = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' }))

  return fileNames
}

async function buildManifest(): Promise<AssetsManifest> {
  const folderEntries = await fs.readdir(FRONTEND_IA_ASSETS_DIR, { withFileTypes: true })

  const products: ManifestProduct[] = []

  for (const entry of folderEntries) {
    if (!entry.isDirectory()) {
      continue
    }

    const folder = entry.name
    const folderPath = path.join(FRONTEND_IA_ASSETS_DIR, folder)
    const imageFiles = await listImageFiles(folderPath)

    if (imageFiles.length === 0) {
      continue
    }

    const slug = toSlug(folder)
    const files: ManifestFile[] = imageFiles.map((fileName, index) => ({
      fileName,
      relativePath: path.posix.join(folder, fileName),
      localPath: path.join(folderPath, fileName),
      role: index === 0 ? 'card' : 'gallery',
      order: index + 1,
    }))

    products.push({ folder, slug, files })
  }

  products.sort((a, b) => a.slug.localeCompare(b.slug, 'es', { sensitivity: 'base' }))

  const totalFiles = products.reduce((acc, product) => acc + product.files.length, 0)

  return {
    generatedAt: new Date().toISOString(),
    assetsRoot: FRONTEND_IA_ASSETS_DIR,
    totalProducts: products.length,
    totalFiles,
    products,
  }
}

async function run() {
  const manifest = await buildManifest()

  await fs.mkdir(OUTPUT_DIR, { recursive: true })
  await fs.writeFile(OUTPUT_FILE, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

  logger.info(
    {
      manifestPath: OUTPUT_FILE,
      totalProducts: manifest.totalProducts,
      totalFiles: manifest.totalFiles,
    },
    'IA assets manifest generated',
  )
}

run().catch((error) => {
  logger.error(error, 'Failed to generate IA assets manifest')
  process.exit(1)
})
