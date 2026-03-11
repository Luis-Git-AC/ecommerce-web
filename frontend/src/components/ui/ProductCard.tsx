import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ProductImage } from '../../types/product'
import styles from './ProductCard.module.css'

type ProductCardProps = {
  id: string
  name: string
  price: string
  image: ProductImage
  to?: string
}

export default function ProductCard({ id, name, price, image, to }: ProductCardProps) {
  const target = to ?? `/product/${id}`
  const [isImageLoading, setIsImageLoading] = useState(Boolean(image.src))
  const [hasImageError, setHasImageError] = useState(!image.src)

  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
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
              className={`${styles.image} ${isImageLoading ? styles.imageHidden : ''}`}
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
        <p className="muted">{price}</p>
        <Link className="btn btn-outline" to={target}>
          Ver detalle
        </Link>
      </div>
    </article>
  )
}
