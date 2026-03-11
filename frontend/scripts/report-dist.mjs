import fs from 'node:fs/promises'
import path from 'node:path'

const rootDir = process.cwd()
const distDir = path.join(rootDir, 'dist')
const assetsDir = path.join(distDir, 'assets')

const bytesToKb = (bytes) => Number((bytes / 1024).toFixed(2))

const walkFiles = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)))
      continue
    }

    files.push(fullPath)
  }

  return files
}

const safeReadDir = async (directory) => {
  try {
    await fs.access(directory)
    return await walkFiles(directory)
  } catch {
    return []
  }
}

const files = await safeReadDir(assetsDir)

if (files.length === 0) {
  console.log('No se encontraron assets en dist/. Ejecuta primero npm run build.')
  process.exit(1)
}

const rows = await Promise.all(
  files.map(async (filePath) => {
    const stat = await fs.stat(filePath)
    const ext = path.extname(filePath).toLowerCase()
    return {
      file: path.relative(distDir, filePath).replace(/\\/g, '/'),
      ext,
      bytes: stat.size,
    }
  }),
)

const byType = rows.reduce((acc, row) => {
  const type = row.ext || 'unknown'
  acc[type] = (acc[type] ?? 0) + row.bytes
  return acc
}, {})

const jsBytes = rows.filter((row) => row.ext === '.js').reduce((sum, row) => sum + row.bytes, 0)
const cssBytes = rows.filter((row) => row.ext === '.css').reduce((sum, row) => sum + row.bytes, 0)
const imageBytes = rows
  .filter((row) => ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.avif'].includes(row.ext))
  .reduce((sum, row) => sum + row.bytes, 0)

const topHeavy = [...rows].sort((a, b) => b.bytes - a.bytes).slice(0, 10)

console.log('--- Dist Report ---')
console.log(`Assets totales: ${rows.length}`)
console.log(`JS total: ${bytesToKb(jsBytes)} KB`)
console.log(`CSS total: ${bytesToKb(cssBytes)} KB`)
console.log(`Imagenes total: ${bytesToKb(imageBytes)} KB`)
console.log('')
console.log('Totales por tipo:')
for (const [ext, bytes] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${ext}: ${bytesToKb(bytes)} KB`)
}

console.log('')
console.log('Top 10 assets mas pesados:')
for (const row of topHeavy) {
  console.log(`  ${row.file} -> ${bytesToKb(row.bytes)} KB`)
}
