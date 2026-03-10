import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type TouchEvent } from 'react'
import { useParams } from 'react-router-dom'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import ProductCard from '../../components/ui/ProductCard'
import { productsMock } from '../../mocks/products.mock'
import styles from './ProductPage.module.css'

const formatLabel = (value: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value)

export default function ProductPage() {
  const { id } = useParams()
  const product = productsMock.find((item) => item.id === id) ?? productsMock[0]

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [id])

  const gallery = useMemo(() => {
    const images = [product.images.card, ...product.images.gallery]
    return images.filter((image, index) => image.src && images.findIndex((item) => item.src === image.src) === index)
  }, [product.images.card, product.images.gallery])

  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null)
  const [transitionDirection, setTransitionDirection] = useState<'next' | 'prev'>('next')
  const [lightboxProductId, setLightboxProductId] = useState<string | null>(null)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const lightboxRef = useRef<HTMLDivElement | null>(null)

  const activeIndexFromSelection = selectedImageSrc
    ? gallery.findIndex((image) => image.src === selectedImageSrc)
    : -1
  const activeIndex = activeIndexFromSelection >= 0 ? activeIndexFromSelection : 0
  const activeImage = gallery[activeIndex] ?? product.images.card
  const isLightboxOpen = lightboxProductId === product.id
  const canGoPrev = activeIndex > 0
  const canGoNext = activeIndex < gallery.length - 1

  const goPrev = useCallback(() => {
    if (!canGoPrev) {
      return
    }

    setTransitionDirection('prev')
    setSelectedImageSrc(gallery[activeIndex - 1]?.src ?? null)
  }, [activeIndex, canGoPrev, gallery])

  const goNext = useCallback(() => {
    if (!canGoNext) {
      return
    }

    setTransitionDirection('next')
    setSelectedImageSrc(gallery[activeIndex + 1]?.src ?? null)
  }, [activeIndex, canGoNext, gallery])

  const goToImage = (targetIndex: number) => {
    if (targetIndex === activeIndex || targetIndex < 0 || targetIndex >= gallery.length) {
      return
    }

    setTransitionDirection(targetIndex > activeIndex ? 'next' : 'prev')
    setSelectedImageSrc(gallery[targetIndex]?.src ?? null)
  }

  const onGalleryKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      goPrev()
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      goNext()
    }
  }

  const onTouchStart = (event: TouchEvent<HTMLElement>) => {
    const touch = event.touches[0]
    touchStartXRef.current = touch.clientX
    touchStartYRef.current = touch.clientY
  }

  const onTouchEnd = (event: TouchEvent<HTMLElement>) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) {
      return
    }

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - touchStartXRef.current
    const deltaY = touch.clientY - touchStartYRef.current
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)
    const swipeThreshold = 40

    touchStartXRef.current = null
    touchStartYRef.current = null

    if (absX < swipeThreshold || absX <= absY) {
      return
    }

    if (deltaX > 0) {
      goPrev()
      return
    }

    goNext()
  }

  useEffect(() => {
    if (!isLightboxOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    lightboxRef.current?.focus()

    const onWindowKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLightboxProductId(null)
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goPrev()
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        goNext()
      }
    }

    window.addEventListener('keydown', onWindowKeyDown)

    return () => {
      window.removeEventListener('keydown', onWindowKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [goNext, goPrev, isLightboxOpen])

  const careInfo = useMemo(
    () => [
      { label: 'Luz', value: formatLabel(product.lightRequired) },
      { label: 'Riego', value: product.careLevel === 'experto' ? '2-3 veces por semana' : '1 vez por semana' },
      { label: 'Dificultad', value: formatLabel(product.careLevel) },
      { label: 'Pet-friendly', value: product.petSafe ? 'Si' : 'No' },
    ],
    [product.careLevel, product.lightRequired, product.petSafe],
  )

  const related = useMemo(
    () => productsMock.filter((item) => item.id !== product.id).slice(0, 3),
    [product.id],
  )

  return (
    <div className="page">
      <Header />
      <main className={styles.product}>
        <div className={`container ${styles.layout}`}>
          <section className={styles.gallery}>
            <div
              className={styles.mainImageWrap}
              role="group"
              aria-label="Galeria de imagenes del producto"
              tabIndex={0}
              onKeyDown={onGalleryKeyDown}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <button
                type="button"
                className={styles.mainImageButton}
                aria-label="Ver imagen ampliada"
                onClick={() => setLightboxProductId(product.id)}
              >
                <picture
                  key={activeImage.src}
                  className={`${styles.mainImageFrame} ${transitionDirection === 'next' ? styles.mainImageFrameNext : styles.mainImageFramePrev}`}
                >
                  {activeImage.webp ? <source srcSet={activeImage.webp} type="image/webp" /> : null}
                  {activeImage.jpg ? <source srcSet={activeImage.jpg} type="image/jpeg" /> : null}
                  <img
                    src={activeImage.src}
                    alt={`${product.name} - imagen ${activeIndex + 1} de ${gallery.length}`}
                    className={styles.mainImage}
                  />
                </picture>
              </button>
              <div className={styles.mainControls}>
                <button
                  type="button"
                  className={styles.navButton}
                  onClick={goPrev}
                  disabled={!canGoPrev}
                  aria-label="Imagen anterior"
                >
                  Anterior
                </button>
                <span className={styles.counterWrap} aria-live="polite">
                  <span
                    className={`${styles.directionHint} ${transitionDirection === 'next' ? styles.directionHintNext : styles.directionHintPrev}`}
                    aria-hidden="true"
                  >
                    {transitionDirection === 'next' ? '>' : '<'}
                  </span>
                  <span className={styles.counter}>
                    {activeIndex + 1}/{gallery.length}
                  </span>
                </span>
                <button
                  type="button"
                  className={styles.navButton}
                  onClick={goNext}
                  disabled={!canGoNext}
                  aria-label="Siguiente imagen"
                >
                  Siguiente
                </button>
              </div>
            </div>
            <div className={styles.thumbs}>
              {gallery.map((image, index) => (
                <button
                  key={image.src}
                  type="button"
                  className={`${styles.thumb} ${index === activeIndex ? styles.thumbActive : ''}`}
                  aria-label={`Ir a imagen ${index + 1}`}
                  aria-pressed={index === activeIndex}
                  onClick={() => goToImage(index)}
                >
                  <picture>
                    {image.webp ? <source srcSet={image.webp} type="image/webp" /> : null}
                    {image.jpg ? <source srcSet={image.jpg} type="image/jpeg" /> : null}
                    <img src={image.src} alt={`${product.name} miniatura ${index + 1}`} />
                  </picture>
                </button>
              ))}
            </div>
          </section>
          <section className={styles.details}>
            <p className={styles.category}>Planta de interior</p>
            <h1>{product.name}</h1>
            <p className={styles.price}>{product.price}</p>
            <p className="muted">
              Ideal para espacios con luz {product.lightRequired} y cuidado {product.careLevel}. Tamano
              {` ${product.size}`} y estilo {product.category}.
            </p>
            <button className="btn">Anadir al carrito</button>
            <div className={styles.care}>
              <h2>Ficha de cuidado</h2>
              <div className={styles.careGrid}>
                {careInfo.map((item) => (
                  <div key={item.label} className={styles.careItem}>
                    <p className={styles.careLabel}>{item.label}</p>
                    <p className={styles.careValue}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
        <section className={`container ${styles.related}`}>
          <div className={styles.relatedHeader}>
            <h2>Quizas tambien te guste</h2>
            <p className="muted">Complementa tu espacio con opciones similares.</p>
          </div>
          <div className={styles.relatedGrid}>
            {related.map((item) => (
              <ProductCard
                key={item.id}
                id={item.id}
                name={item.name}
                price={item.price}
                image={item.images.card}
              />
            ))}
          </div>
        </section>
      </main>
      {isLightboxOpen ? (
        <div className={styles.lightboxOverlay} role="presentation" onClick={() => setLightboxProductId(null)}>
          <div
            className={styles.lightboxDialog}
            role="dialog"
            aria-modal="true"
            aria-label={`Vista ampliada de ${product.name}`}
            onClick={(event) => event.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            ref={lightboxRef}
            tabIndex={-1}
          >
            <button
              type="button"
              className={styles.lightboxClose}
              onClick={() => setLightboxProductId(null)}
              aria-label="Cerrar vista ampliada"
            >
              Cerrar
            </button>
            <picture className={styles.lightboxImageFrame}>
              {activeImage.webp ? <source srcSet={activeImage.webp} type="image/webp" /> : null}
              {activeImage.jpg ? <source srcSet={activeImage.jpg} type="image/jpeg" /> : null}
              <img
                src={activeImage.src}
                alt={`${product.name} - vista ampliada ${activeIndex + 1} de ${gallery.length}`}
                className={styles.lightboxImage}
              />
            </picture>
            <div className={styles.lightboxControls}>
              <button
                type="button"
                className={styles.navButton}
                onClick={goPrev}
                disabled={!canGoPrev}
                aria-label="Imagen anterior"
              >
                Anterior
              </button>
              <span className={styles.counterWrap}>
                <span className={styles.counter}>
                  {activeIndex + 1}/{gallery.length}
                </span>
              </span>
              <button
                type="button"
                className={styles.navButton}
                onClick={goNext}
                disabled={!canGoNext}
                aria-label="Siguiente imagen"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <Footer />
    </div>
  )
}
