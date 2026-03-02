import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const rootDir = process.cwd()
const inputDir = path.join(rootDir, 'src', 'assets', 'hero')
const outputDir = path.join(inputDir, 'optimized')
const manifestPath = path.join(inputDir, 'heroFrames.ts')

const frames = [1, 2, 3, 4, 5, 6]
const loopOrder = [3, 1, 5, 2, 6, 4]

const variants = [
	{ name: 'desktop', width: 2200, jpegQuality: 78, webpQuality: 74 },
	{ name: 'mobile', width: 1200, jpegQuality: 72, webpQuality: 70 },
]

await fs.mkdir(outputDir, { recursive: true })

for (const frame of frames) {
	const sourceFile = path.join(inputDir, `loop_${frame}.jpg`)

	for (const variant of variants) {
		const baseName = `loop_${frame}_${variant.name}`

		const jpegTarget = path.join(outputDir, `${baseName}.jpg`)
		await sharp(sourceFile)
			.resize({ width: variant.width, fit: 'inside', withoutEnlargement: true })
			.jpeg({ quality: variant.jpegQuality, mozjpeg: true })
			.toFile(jpegTarget)

		const webpTarget = path.join(outputDir, `${baseName}.webp`)
		await sharp(sourceFile)
			.resize({ width: variant.width, fit: 'inside', withoutEnlargement: true })
			.webp({ quality: variant.webpQuality })
			.toFile(webpTarget)
	}
}

const buildManifest = () => {
	const importLines = []

	for (const frame of frames) {
		importLines.push(`import loop${frame}DesktopJpg from './optimized/loop_${frame}_desktop.jpg'`)
		importLines.push(`import loop${frame}DesktopWebp from './optimized/loop_${frame}_desktop.webp'`)
		importLines.push(`import loop${frame}MobileJpg from './optimized/loop_${frame}_mobile.jpg'`)
		importLines.push(`import loop${frame}MobileWebp from './optimized/loop_${frame}_mobile.webp'`)
	}

	const frameMapLines = frames.map((frame) => {
		return `  ${frame}: {
		desktopJpg: loop${frame}DesktopJpg,
		desktopWebp: loop${frame}DesktopWebp,
		mobileJpg: loop${frame}MobileJpg,
		mobileWebp: loop${frame}MobileWebp,
	},`
	})

	const order = loopOrder.join(', ')

	return `${importLines.join('\n')}

export type HeroFrame = {
	desktopJpg: string
	desktopWebp: string
	mobileJpg: string
	mobileWebp: string
}

const frameMap: Record<number, HeroFrame> = {
${frameMapLines.join('\n')}
}

const loopOrder = [${order}] as const

export const heroFrames: HeroFrame[] = loopOrder.map((index) => frameMap[index])
`
}

await fs.writeFile(manifestPath, buildManifest(), 'utf8')

console.log('Hero assets optimized in src/assets/hero/optimized')
console.log('Hero manifest updated in src/assets/hero/heroFrames.ts')
