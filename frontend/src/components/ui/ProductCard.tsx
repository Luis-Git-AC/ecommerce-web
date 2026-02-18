import { Link } from 'react-router-dom'
import styles from './ProductCard.module.css'

type ProductCardProps = {
  id: string
  name: string
  price: string
  image: string
  to?: string
}

export default function ProductCard({ id, name, price, image, to }: ProductCardProps) {
  const target = to ?? `/product/${id}`

  return (
    <article className={styles.card}>
      <img src={image} alt={name} className={styles.image} />
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
