import fs from 'node:fs/promises'
import path from 'node:path'
import zlib from 'node:zlib'
import { promisify } from 'node:util'

const gzip = promisify(zlib.gzip)

const rootDir = process.cwd()
const assetsDir = path.join(rootDir, 'dist', 'assets')

/**
 * El criterio principal es el tamano transferido (gzip): es lo que descarga el
 * usuario y lo que sirve Vercel. Los limites en crudo se conservan como techo
 * secundario para detectar crecimientos anomalos del bundle.
 *
 * Nota: los design tokens encarecen el CSS en crudo — `var(--color-brand)` son
 * 19 caracteres frente a los 7 de `#2e8b57`, y hay ~485 sustituciones — pero el
 * coste tras comprimir es practicamente nulo porque son cadenas muy repetidas.
 */
const budgets = {
  maxMainJsGzipKb: 90,
  maxMainCssGzipKb: 15,
  maxTotalJsGzipKb: 160,
  maxMainJsKb: 320,
  maxMainCssKb: 60,
  maxTotalJsKb: 600,
}

const bytesToKb = (bytes) => bytes / 1024

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

try {
  await fs.access(assetsDir)
} catch {
  console.error('No existe dist/assets. Ejecuta primero npm run build.')
  process.exit(1)
}

const files = await walkFiles(assetsDir)
const rows = await Promise.all(
  files.map(async (filePath) => {
    const content = await fs.readFile(filePath)
    const compressed = await gzip(content)
    return {
      file: path.basename(filePath),
      ext: path.extname(filePath).toLowerCase(),
      sizeKb: bytesToKb(content.length),
      gzipKb: bytesToKb(compressed.length),
    }
  }),
)

const jsFiles = rows.filter((row) => row.ext === '.js')
const cssFiles = rows.filter((row) => row.ext === '.css')

const mainJs = [...jsFiles].sort((a, b) => b.sizeKb - a.sizeKb)[0]
const mainCss = [...cssFiles].sort((a, b) => b.sizeKb - a.sizeKb)[0]
const totalJsKb = jsFiles.reduce((sum, row) => sum + row.sizeKb, 0)
const totalJsGzipKb = jsFiles.reduce((sum, row) => sum + row.gzipKb, 0)

const failures = []

const check = (label, actual, limit, file) => {
  if (actual > limit) {
    failures.push(
      `${label} supera presupuesto: ${actual.toFixed(2)} KB > ${limit} KB${file ? ` (${file})` : ''}`,
    )
  }
}

check('Main JS (gzip)', mainJs?.gzipKb ?? 0, budgets.maxMainJsGzipKb, mainJs?.file)
check('Main CSS (gzip)', mainCss?.gzipKb ?? 0, budgets.maxMainCssGzipKb, mainCss?.file)
check('JS total (gzip)', totalJsGzipKb, budgets.maxTotalJsGzipKb)
check('Main JS (crudo)', mainJs?.sizeKb ?? 0, budgets.maxMainJsKb, mainJs?.file)
check('Main CSS (crudo)', mainCss?.sizeKb ?? 0, budgets.maxMainCssKb, mainCss?.file)
check('JS total (crudo)', totalJsKb, budgets.maxTotalJsKb)

const line = (label, raw, gz, limit) =>
  `${label.padEnd(10)} ${raw.toFixed(2).padStart(8)} KB   gzip ${gz.toFixed(2).padStart(7)} KB   (límite gzip ${limit} KB)`

console.log('--- Budget Check ---')
console.log(line('Main JS', mainJs?.sizeKb ?? 0, mainJs?.gzipKb ?? 0, budgets.maxMainJsGzipKb))
console.log(line('Main CSS', mainCss?.sizeKb ?? 0, mainCss?.gzipKb ?? 0, budgets.maxMainCssGzipKb))
console.log(line('JS total', totalJsKb, totalJsGzipKb, budgets.maxTotalJsGzipKb))
console.log(`Chunks: ${jsFiles.length} JS · ${cssFiles.length} CSS`)

if (failures.length > 0) {
  console.error('')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Presupuestos OK.')
