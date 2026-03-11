import fs from 'node:fs/promises'
import path from 'node:path'

const rootDir = process.cwd()
const assetsDir = path.join(rootDir, 'dist', 'assets')

const budgets = {
  maxMainJsKb: 320,
  maxMainCssKb: 40,
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
    const stat = await fs.stat(filePath)
    const ext = path.extname(filePath).toLowerCase()
    return {
      file: path.basename(filePath),
      ext,
      sizeKb: bytesToKb(stat.size),
    }
  }),
)

const jsFiles = rows.filter((row) => row.ext === '.js')
const cssFiles = rows.filter((row) => row.ext === '.css')

const mainJs = [...jsFiles].sort((a, b) => b.sizeKb - a.sizeKb)[0]
const mainCss = [...cssFiles].sort((a, b) => b.sizeKb - a.sizeKb)[0]
const totalJsKb = jsFiles.reduce((sum, row) => sum + row.sizeKb, 0)

const failures = []

if (mainJs && mainJs.sizeKb > budgets.maxMainJsKb) {
  failures.push(`Main JS supera presupuesto: ${mainJs.sizeKb.toFixed(2)} KB > ${budgets.maxMainJsKb} KB (${mainJs.file})`)
}

if (mainCss && mainCss.sizeKb > budgets.maxMainCssKb) {
  failures.push(`Main CSS supera presupuesto: ${mainCss.sizeKb.toFixed(2)} KB > ${budgets.maxMainCssKb} KB (${mainCss.file})`)
}

if (totalJsKb > budgets.maxTotalJsKb) {
  failures.push(`JS total supera presupuesto: ${totalJsKb.toFixed(2)} KB > ${budgets.maxTotalJsKb} KB`)
}

console.log('--- Budget Check ---')
console.log(`Main JS: ${(mainJs?.sizeKb ?? 0).toFixed(2)} KB`) 
console.log(`Main CSS: ${(mainCss?.sizeKb ?? 0).toFixed(2)} KB`)
console.log(`JS total: ${totalJsKb.toFixed(2)} KB`)

if (failures.length > 0) {
  console.error('')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Presupuestos OK.')
