import { Link, useParams } from 'react-router-dom'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import { blogPostsMock } from '../../mocks/blog.mock'
import styles from './BlogPostPage.module.css'

export default function BlogPostPage() {
  const { slug = '' } = useParams()
  const post = blogPostsMock.find((item) => item.id === slug)

  const title = post?.title ?? 'Guia VerdeVivo'
  const date = post?.date ?? 'Proximamente'
  const category = post?.category ?? 'Guia'
  const image = post?.image

  return (
    <div className="page">
      <Header />
      <main className={styles.post}>
        <section className={`container ${styles.hero}`}>
          <Link className={styles.backLink} to="/blog">Volver al blog</Link>
          <p className={styles.eyebrow}>Guia VerdeVivo</p>
          <h1>{title}</h1>
          <div className={styles.meta}>
            <span>{date}</span>
            <span>{category}</span>
          </div>
        </section>

        <section className={`container ${styles.content}`}>
          {image ? <img className={styles.image} src={image} alt={title} /> : null}
          <p className="muted">Contenido provisional.</p>
          <p className="muted">
            Si quieres una version personalizada, escribe a nuestro equipo y te enviaremos recursos y consejos.
          </p>
          <Link className="btn" to="/contact">Contactar</Link>
        </section>
      </main>
      <Footer />
    </div>
  )
}
