import loop1DesktopJpg from './optimized/loop_1_desktop.jpg'
import loop1DesktopWebp from './optimized/loop_1_desktop.webp'
import loop1MobileJpg from './optimized/loop_1_mobile.jpg'
import loop1MobileWebp from './optimized/loop_1_mobile.webp'
import loop2DesktopJpg from './optimized/loop_2_desktop.jpg'
import loop2DesktopWebp from './optimized/loop_2_desktop.webp'
import loop2MobileJpg from './optimized/loop_2_mobile.jpg'
import loop2MobileWebp from './optimized/loop_2_mobile.webp'
import loop3DesktopJpg from './optimized/loop_3_desktop.jpg'
import loop3DesktopWebp from './optimized/loop_3_desktop.webp'
import loop3MobileJpg from './optimized/loop_3_mobile.jpg'
import loop3MobileWebp from './optimized/loop_3_mobile.webp'
import loop4DesktopJpg from './optimized/loop_4_desktop.jpg'
import loop4DesktopWebp from './optimized/loop_4_desktop.webp'
import loop4MobileJpg from './optimized/loop_4_mobile.jpg'
import loop4MobileWebp from './optimized/loop_4_mobile.webp'
import loop5DesktopJpg from './optimized/loop_5_desktop.jpg'
import loop5DesktopWebp from './optimized/loop_5_desktop.webp'
import loop5MobileJpg from './optimized/loop_5_mobile.jpg'
import loop5MobileWebp from './optimized/loop_5_mobile.webp'
import loop6DesktopJpg from './optimized/loop_6_desktop.jpg'
import loop6DesktopWebp from './optimized/loop_6_desktop.webp'
import loop6MobileJpg from './optimized/loop_6_mobile.jpg'
import loop6MobileWebp from './optimized/loop_6_mobile.webp'

export type HeroFrame = {
	desktopJpg: string
	desktopWebp: string
	mobileJpg: string
	mobileWebp: string
}

const frameMap: Record<number, HeroFrame> = {
  1: {
		desktopJpg: loop1DesktopJpg,
		desktopWebp: loop1DesktopWebp,
		mobileJpg: loop1MobileJpg,
		mobileWebp: loop1MobileWebp,
	},
  2: {
		desktopJpg: loop2DesktopJpg,
		desktopWebp: loop2DesktopWebp,
		mobileJpg: loop2MobileJpg,
		mobileWebp: loop2MobileWebp,
	},
  3: {
		desktopJpg: loop3DesktopJpg,
		desktopWebp: loop3DesktopWebp,
		mobileJpg: loop3MobileJpg,
		mobileWebp: loop3MobileWebp,
	},
  4: {
		desktopJpg: loop4DesktopJpg,
		desktopWebp: loop4DesktopWebp,
		mobileJpg: loop4MobileJpg,
		mobileWebp: loop4MobileWebp,
	},
  5: {
		desktopJpg: loop5DesktopJpg,
		desktopWebp: loop5DesktopWebp,
		mobileJpg: loop5MobileJpg,
		mobileWebp: loop5MobileWebp,
	},
  6: {
		desktopJpg: loop6DesktopJpg,
		desktopWebp: loop6DesktopWebp,
		mobileJpg: loop6MobileJpg,
		mobileWebp: loop6MobileWebp,
	},
}

const loopOrder = [3, 1, 5, 2, 6, 4] as const

export const heroFrames: HeroFrame[] = loopOrder.map((index) => frameMap[index])
