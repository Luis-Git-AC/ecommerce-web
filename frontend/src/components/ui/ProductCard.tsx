import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ProductImage } from '../../types/product'
import styles from './ProductCard.module.css'

type ProductCardProps = {
  id: string
  name: string
  price: string
  image: ProductImage
  imageMode?: 'cover' | 'contain-mobile'
  mobileLayout?: 'default' | 'editorial'
  to?: string
  variant?: 'default' | 'home'
}

export default function ProductCard({
  id,
  name,
  price,
  image,
  imageMode = 'cover',
  mobileLayout = 'default',
  to,
  variant = 'default',
}: ProductCardProps) {
  const target = to ?? `/product/${id}`
  const [isImageLoading, setIsImageLoading] = useState(Boolean(image.src))
  const [hasImageError, setHasImageError] = useState(!image.src)
  const isHomeVariant = variant === 'home'
  const cardClassName = [
    styles.card,
    isHomeVariant ? styles.cardHome : '',
    mobileLayout === 'editorial' ? styles.mobileEditorial : '',
  ].filter(Boolean).join(' ')
  const imageWrapClassName = imageMode === 'contain-mobile' ? `${styles.imageWrap} ${styles.imageWrapContainMobile}` : styles.imageWrap
  const imageClassName = imageMode === 'contain-mobile'
    ? `${styles.image} ${styles.imageContainMobile} ${isImageLoading ? styles.imageHidden : ''}`
    : `${styles.image} ${isImageLoading ? styles.imageHidden : ''}`
  const priceClassName = isHomeVariant ? `muted ${styles.priceHome}` : 'muted'
  const linkClassName = isHomeVariant ? `btn btn-outline ${styles.linkHome}` : 'btn btn-outline'

  return (
    <article className={cardClassName}>
      <div className={imageWrapClassName}>
        {isImageLoading && !hasImageError ? <div className={styles.imageSkeleton} aria-hidden="true" /> : null}
        {hasImageError ? (
          <div className={styles.imageFallback} role="status" aria-live="polite">
            Imagen no disponible
          </div>
        ) : (
          <picture>
            {image.webp ? <source srcSet={image.webp} type="image/webp" /> : null}
            {image.jpg ? <source srcSet={image.jpg} type="image/jpeg" /> : null}
            <img
              src={image.src}
              alt={name}
              className={imageClassName}
              loading="lazy"
              onLoad={() => setIsImageLoading(false)}
              onError={() => {
                setIsImageLoading(false)
                setHasImageError(true)
              }}
            />
          </picture>
        )}
      </div>
      <div className={styles.body}>
        <h3>{name}</h3>
        <p className={priceClassName}>{price}</p>
        <Link className={linkClassName} to={target}>
          Ver detalle
        </Link>
      </div>
    </article>
  )
}
