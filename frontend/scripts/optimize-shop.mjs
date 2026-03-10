import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const rootDir = process.cwd()
const inputDir = path.join(rootDir, 'src', 'assets', 'shop')
const outputDir = path.join(inputDir, 'optimized')

const OUTPUT_SIZE = 1200
const JPEG_QUALITY = 76
const WEBP_QUALITY = 74

const supportedExtensions = new Set(['.jpg', '.jpeg', '.webp', '.png'])

const toPosixPath = (value) => value.split(path.sep).join('/')

const walkFiles = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (entry.name === 'optimized') {
      continue
    }

    const fullPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)))
      continue
    }

    const extension = path.extname(entry.name).toLowerCase()
    if (supportedExtensions.has(extension)) {
      files.push(fullPath)
    }
  }

  return files
}

const optimizeImage = async (filePath) => {
  const relativeInput = path.relative(inputDir, filePath)
  const normalizedRelative = toPosixPath(relativeInput)
  const relativeWithoutExtension = normalizedRelative.replace(/\.[^.]+$/i, '')

  const targetBase = path.join(outputDir, relativeWithoutExtension)
  const targetJpg = `${targetBase}.jpg`
  const targetWebp = `${targetBase}.webp`

  await fs.mkdir(path.dirname(targetJpg), { recursive: true })

  const pipeline = sharp(filePath, { failOn: 'warning' }).rotate().resize({
    width: OUTPUT_SIZE,
    height: OUTPUT_SIZE,
    fit: 'cover',
    position: sharp.strategy.attention,
  })

  await pipeline.clone().jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(targetJpg)
  await pipeline.clone().webp({ quality: WEBP_QUALITY }).toFile(targetWebp)

  return {
    source: normalizedRelative,
    jpg: toPosixPath(path.relative(inputDir, targetJpg)),
    webp: toPosixPath(path.relative(inputDir, targetWebp)),
  }
}

const sourceFiles = await walkFiles(inputDir)

await fs.rm(outputDir, { recursive: true, force: true })
await fs.mkdir(outputDir, { recursive: true })

const outputs = []
for (const filePath of sourceFiles) {
  outputs.push(await optimizeImage(filePath))
}

const manifestPath = path.join(outputDir, 'manifest.json')
await fs.writeFile(manifestPath, `${JSON.stringify(outputs, null, 2)}\n`, 'utf8')

console.log(`Optimized ${outputs.length} source images`)
console.log(`Generated ${outputs.length * 2} files in src/assets/shop/optimized`)
console.log('Manifest written to src/assets/shop/optimized/manifest.json')
