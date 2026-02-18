import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import { blogPostsMock } from '../../mocks/blog.mock'
import styles from './BlogPage.module.css'

const categories = ['Todos', 'Cuidados', 'Diseño', 'Problemas comunes'] as const

export default function BlogPage() {
  return (
    <div className="page">
      <Header />
      <main className={styles.blog}>
        <section className={`container ${styles.hero}`}>
          <div>
            <p className={styles.eyebrow}>Blog VerdeVivo</p>
            <h1>Guias y consejos para cuidar tus plantas</h1>
            <p className="muted">
              Articulos practicos para mejorar el cuidado, resolver problemas comunes y crear espacios mas verdes.
            </p>
          </div>
        </section>

        <section className={`container ${styles.content}`}>
          <div className={styles.filters}>
            {categories.map((category) => (
              <button key={category} type="button" className={styles.filterButton}>
                {category}
              </button>
            ))}
          </div>

          <div className={styles.grid}>
            {blogPostsMock.map((post) => (
              <article key={post.id} className={styles.card}>
                <img src={post.image} alt={post.title} />
                <div className={styles.cardBody}>
                  <span className={styles.tag}>{post.category}</span>
                  <h3>{post.title}</h3>
                  <p className="muted">{post.excerpt}</p>
                  <div className={styles.cardMeta}>
                    <span>{post.date}</span>
                    <a href="#">Leer guia</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
