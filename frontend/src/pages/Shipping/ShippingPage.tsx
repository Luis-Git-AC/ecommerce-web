import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import styles from './ShippingPage.module.css'

const items = [
  {
    title: 'Envio protegido',
    description: 'Empaques seguros para evitar danos durante el transporte.',
  },
  {
    title: 'Tiempos claros',
    description: 'Entregas en 24/48h en zonas principales y 3-5 dias en el resto.',
  },
  {
    title: 'Seguimiento',
    description: 'Recibes actualizaciones del estado de tu pedido.',
  },
]

export default function ShippingPage() {
  return (
    <div className="page">
      <Header />
      <main className={styles.shipping}>
        <section className="container page-hero">
          <p className="page-eyebrow">Envios</p>
          <h1>Entregas cuidadas para que tu planta llegue perfecta</h1>
          <p className="muted">Cuidamos el embalaje y el transporte para reducir el estres de la planta.</p>
        </section>

        <section className={`container ${styles.content}`}>
          <div className={styles.grid}>
            {items.map((item) => (
              <article key={item.title} className={styles.card}>
                <h3>{item.title}</h3>
                <p className="muted">{item.description}</p>
              </article>
            ))}
          </div>
          <div className={styles.detail}>
            <div>
              <h2>Costes y zonas</h2>
              <p className="muted">Envio gratis en pedidos superiores a $45. Tarifas estandar desde $4.90.</p>
            </div>
            <div>
              <h2>Politica de incidencias</h2>
              <p className="muted">Si tu planta llega en mal estado, contactanos en 48 horas para gestionarlo.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
