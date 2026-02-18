import styles from './ProductCard.module.css'

type ProductCardProps = {
  name: string
  price: string
  image: string
  href?: string
}

export default function ProductCard({ name, price, image, href = '/product' }: ProductCardProps) {
  return (
    <article className={styles.card}>
      <img src={image} alt={name} className={styles.image} />
      <div className={styles.body}>
        <h3>{name}</h3>
        <p className="muted">{price}</p>
        <a className="btn btn-outline" href={href}>
          Ver detalle
        </a>
      </div>
    </article>
  )
}
