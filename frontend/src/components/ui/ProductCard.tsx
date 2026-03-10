import { Link } from 'react-router-dom'
import type { ProductImage } from '../../mocks/products.mock'
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

  return (
    <article className={styles.card}>
      <picture>
        {image.webp ? <source srcSet={image.webp} type="image/webp" /> : null}
        {image.jpg ? <source srcSet={image.jpg} type="image/jpeg" /> : null}
        <img src={image.src} alt={name} className={styles.image} loading="lazy" />
      </picture>
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
