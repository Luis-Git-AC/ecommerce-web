import type { CSSProperties } from 'react'
import styles from './Skeleton.module.css'

type SkeletonVariant = 'text' | 'title' | 'image' | 'block' | 'circle'

type SkeletonProps = {
  variant?: SkeletonVariant
  width?: string
  height?: string
  className?: string
}

export default function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
}: SkeletonProps) {
  const style: CSSProperties = {}

  if (width) {
    style.width = width
  }

  if (height) {
    style.height = height
  }

  return (
    <span
      aria-hidden="true"
      className={`${styles.skeleton} ${styles[variant]} ${className}`.trim()}
      style={style}
    />
  )
}
