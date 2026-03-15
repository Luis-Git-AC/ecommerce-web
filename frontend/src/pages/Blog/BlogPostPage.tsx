import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import { contentRepository, type BlogPost } from '../../services/content.repository'
import styles from './BlogPostPage.module.css'

export default function BlogPostPage() {
  const { slug = '' } = useParams()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await contentRepository.getBlogBySlug(slug)
        if (isMounted) {
          setPost(data)
        }
      } catch (requestError) {
        if (isMounted) {
          const message = requestError instanceof Error ? requestError.message : 'No se pudo cargar la guía.'
          setError(message)
          setPost(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (!slug) {
      setLoading(false)
      setError('Slug inválido.')
      return () => {
        isMounted = false
      }
    }

    void run()

    return () => {
      isMounted = false
    }
  }, [slug])

  const title = post?.title ?? 'Guía VerdeVivo'
  const date = post ? new Date(post.publishedAt).toLocaleDateString('es-ES') : 'Próximamente'
  const category = post?.category ?? 'Guía'
  const image = post?.image

  return (
    <div className="page">
      <Header />
      <main className={styles.post}>
        <section className="container page-hero">
          <Link className={styles.backLink} to="/blog">Volver al blog</Link>
          <p className="page-eyebrow">Guía VerdeVivo</p>
          <h1>{title}</h1>
          <div className={styles.meta}>
            <span>{date}</span>
            <span>{category}</span>
          </div>
        </section>

        <section className={`container ${styles.content}`}>
          {loading ? <p className="muted">Cargando artículo...</p> : null}
          {error ? <p className="muted">{error}</p> : null}
          {image ? <img className={styles.image} src={image} alt={title} /> : null}
          <p className="muted">{post?.content ?? 'Este artículo estará disponible pronto.'}</p>
          <p className="muted">
            Si quieres una versión personalizada, escribe a nuestro equipo y te enviaremos recursos y consejos.
          </p>
          <Link className="btn" to="/contact">Contactar</Link>
        </section>
      </main>
      <Footer />
    </div>
  )
}
