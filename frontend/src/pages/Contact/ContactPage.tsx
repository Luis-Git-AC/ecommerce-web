import { useState } from 'react'
import type { FormEvent } from 'react'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import { contentRepository } from '../../services/content.repository'
import styles from './ContactPage.module.css'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const trimmedMessage = message.trim()
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)

    if (!trimmedName || !trimmedMessage || !isValidEmail) {
      setStatusMessage('Completa todos los campos con un correo válido.')
      setStatusType('error')
      return
    }

    try {
      setIsSubmitting(true)
      setStatusMessage('')
      setStatusType(null)

      await contentRepository.createContactMessage({
        name: trimmedName,
        email: trimmedEmail,
        message: trimmedMessage,
      })

      setStatusMessage('Mensaje enviado. Te responderemos dentro de 24 horas hábiles.')
      setStatusType('success')
      setName('')
      setEmail('')
      setMessage('')
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'No se pudo enviar el mensaje.'
      setStatusMessage(messageText)
      setStatusType('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page brand-page">
      <Header />
      <main className={styles.contact}>
        <section className="container page-hero">
          <p className="page-eyebrow">Contacto</p>
          <h1>Estamos aquí para ayudarte</h1>
          <p className="muted">Escríbenos y respondemos en menos de 24 horas.</p>
        </section>

        <section className={`container ${styles.content}`}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="name">Nombre</label>
              <input
                id="name"
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="message">Mensaje</label>
              <textarea
                id="message"
                rows={4}
                placeholder="¿Cómo podemos ayudarte?"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </div>
            <button className="btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
            </button>
            {statusMessage ? (
              <p
                className={`${styles.statusMessage} ${statusType === 'error' ? styles.statusError : styles.statusSuccess}`}
                role={statusType === 'error' ? 'alert' : 'status'}
                aria-live={statusType === 'error' ? 'assertive' : 'polite'}
              >
                {statusMessage}
              </p>
            ) : null}
          </form>

          <div className={styles.info}>
            <h2>Datos de contacto</h2>
            <p className="muted">{'hola@{ecommerce}.com'}</p>
            <p className="muted">+34 900 123 456</p>
            <p className="muted">Madrid, ES</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
