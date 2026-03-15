import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import { contentRepository, type BlogPost } from '../../services/content.repository'
import styles from './BlogPage.module.css'

const categories = ['Todos', 'Cuidados', 'Diseño', 'Problemas comunes'] as const

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>('Todos')

  useEffect(() => {
    let isMounted = true

    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await contentRepository.listBlog()
        if (isMounted) {
          setPosts(data)
        }
      } catch (requestError) {
        if (isMounted) {
          const message = requestError instanceof Error ? requestError.message : 'No se pudo cargar el blog.'
          setError(message)
          setPosts([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void run()

    return () => {
      isMounted = false
    }
  }, [])

  const visiblePosts = useMemo(
    () =>
      activeCategory === 'Todos'
        ? posts
        : posts.filter((post) => post.category === activeCategory),
    [activeCategory, posts],
  )

  return (
    <div className="page">
      <Header />
      <main className={styles.blog}>
        <section className="container page-hero">
          <div>
            <p className="page-eyebrow">Blog VerdeVivo</p>
            <h1>Guías y consejos para cuidar tus plantas</h1>
            <p className="muted">
              Artículos prácticos para mejorar el cuidado, resolver problemas comunes y crear espacios más verdes.
            </p>
          </div>
        </section>

        <section className={`container ${styles.content}`}>
          <div className={styles.filters}>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`${styles.filterButton} ${activeCategory === category ? styles.filterButtonActive : ''}`}
                onClick={() => setActiveCategory(category)}
                aria-pressed={activeCategory === category}
              >
                {category}
              </button>
            ))}
          </div>

          {loading ? <p className="muted">Cargando artículos...</p> : null}
          {error ? <p className="muted">{error}</p> : null}
          {!loading && !error ? (
            <div className={styles.grid}>
              {visiblePosts.map((post) => (
                <article key={post._id} className={styles.card}>
                  <img src={post.image} alt={post.title} />
                  <div className={styles.cardBody}>
                    <span className={styles.tag}>{post.category}</span>
                    <h3>{post.title}</h3>
                    <p className="muted">{post.excerpt}</p>
                    <div className={styles.cardMeta}>
                      <span>{new Date(post.publishedAt).toLocaleDateString('es-ES')}</span>
                      <Link to={`/blog/${post.slug}`}>Leer guía</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </main>
      <Footer />
    </div>
  )
}
