import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './QuizSection.module.css'

const QUESTIONS = [
  {
    id: 'light',
    title: '¿Cuánta luz natural recibe tu espacio?',
    options: ['Baja', 'Media', 'Alta'],
    icons: ['moon', 'sun', 'sun-bright'],
  },
  {
    id: 'care',
    title: '¿Con qué frecuencia puedes ocuparte del riego?',
    options: ['1 vez cada 10–14 días', '1 vez por semana', '2–3 veces por semana'],
    icons: ['drop', 'drop-half', 'drop-multi'],
  },
  {
    id: 'experience',
    title: '¿Cuál es tu nivel de experiencia con plantas?',
    options: ['Principiante (prefiero fácil)', 'Intermedio', 'Experto (me gustan los retos)'],
    icons: ['sprout', 'leaf', 'leaf-strong'],
  },
  {
    id: 'style',
    title: '¿Qué estilo de planta prefieres?',
    options: ['Compacta', 'Grande', 'Colgante'],
    icons: ['square', 'tall', 'hanging'],
  },
]

const getIcon = (name: string) => {
  switch (name) {
    case 'moon':
      return (
        <path d="M13.5 3.5a6.5 6.5 0 0 0 7 9.6A8 8 0 1 1 13.5 3.5Z" />
      )
    case 'sun':
      return (
        <path d="M12 4.5v2.2M12 17.3v2.2M4.5 12h2.2M17.3 12h2.2M6.2 6.2l1.6 1.6M16.2 16.2l1.6 1.6M6.2 17.8l1.6-1.6M16.2 7.8l1.6-1.6M12 8a4 4 0 1 1-4 4 4 4 0 0 1 4-4Z" />
      )
    case 'sun-bright':
      return (
        <path d="M12 3.5v2.5M12 18v2.5M3.5 12h2.5M18 12h2.5M6 6l1.8 1.8M16.2 16.2 18 18M6 18l1.8-1.8M16.2 7.8 18 6M12 7a5 5 0 1 1-5 5 5 5 0 0 1 5-5Z" />
      )
    case 'drop':
      return <path d="M12 4c3.5 4.5 5 7 5 9a5 5 0 1 1-10 0c0-2 1.5-4.5 5-9Z" />
    case 'drop-half':
      return (
        <path d="M12 4c3.5 4.5 5 7 5 9a5 5 0 1 1-10 0c0-2 1.5-4.5 5-9Zm0 6v8" />
      )
    case 'drop-multi':
      return (
        <path d="M8 5c2.5 3.2 3.6 5 3.6 6.4a3.6 3.6 0 0 1-7.2 0C4.4 10 5.5 8.2 8 5Zm8 1.5c2.8 3.6 4 5.6 4 7.3a4 4 0 1 1-8 0c0-1.7 1.2-3.7 4-7.3Z" />
      )
    case 'sprout':
      return <path d="M12 19V9M12 9c-3.5 0-6-2-6-5 3.5 0 6 2 6 5Zm0 0c3.5 0 6-2 6-5-3.5 0-6 2-6 5Z" />
    case 'leaf':
      return <path d="M6 14c6-6 12-6 12-6-1 6-6 10-12 10a6 6 0 0 1 0-4Z" />
    case 'leaf-strong':
      return <path d="M5 13c6-7 13-7 13-7-1 7-7 12-13 12-2 0-3-2-3-4 0-1 1-1 3-1Z" />
    case 'square':
      return <path d="M7 7h10v10H7z" />
    case 'tall':
      return <path d="M10 4h4v16h-4z" />
    case 'hanging':
      return <path d="M12 4v4m-4 4a4 4 0 0 0 8 0c0-2-1.5-3.5-4-6-2.5 2.5-4 4-4 6Z" />
    default:
      return null
  }
}

const getSummary = (answers: string[]) => {
  if (!answers.length) return 'Selecciona tus preferencias y te daremos una recomendación.'

  const [light, care, experience, style] = answers
  if (!light || !care || !experience || !style) {
    return 'Completa todas las respuestas para obtener una recomendación.'
  }

  if (light === 'Baja' && care === '1 vez cada 10–14 días') {
    return 'Te recomendamos especies resistentes y de bajo mantenimiento.'
  }

  if (light === 'Alta' && experience.includes('Experto')) {
    return 'Puedes explorar plantas exigentes con crecimiento rápido.'
  }

  if (style === 'Colgante') {
    return 'Las plantas colgantes aportarán movimiento y volumen a tu espacio.'
  }

  return 'Te sugerimos una selección equilibrada según tu espacio y ritmo de cuidado.'
}

export default function QuizSection() {
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>(Array(QUESTIONS.length).fill(''))

  const totalSteps = QUESTIONS.length
  const current = QUESTIONS[stepIndex]
  const isLastStep = stepIndex === totalSteps - 1
  const progress = Math.round(((stepIndex + 1) / totalSteps) * 100)

  const summary = useMemo(() => getSummary(answers), [answers])

  const handleSelect = (value: string) => {
    setAnswers((prev) => {
      const next = [...prev]
      next[stepIndex] = value
      return next
    })
  }

  const goNext = () => {
    if (isLastStep) return
    setStepIndex((prev) => Math.min(prev + 1, totalSteps - 1))
  }

  const goBack = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0))
  }

  const resetQuiz = () => {
    setStepIndex(0)
    setAnswers(Array(QUESTIONS.length).fill(''))
  }

  const handlePrimaryAction = () => {
    if (isLastStep) {
      navigate('/shop')
      return
    }
    if (!answers[stepIndex]) return
    goNext()
  }

  return (
    <section id="quiz" className="section">
      <div className="container section-inner">
        <div className="section-header">
          <h2>Encuentra tu planta perfecta</h2>
          <p className="muted">Un quiz rápido para recomendarte opciones ideales.</p>
        </div>
        <div className={styles.quizCard}>
          <div className={styles.quizHeader}>
            <span className={styles.pill}>Paso {stepIndex + 1} de {totalSteps}</span>
            <div className={styles.progress} aria-hidden="true">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className={styles.quizStep}>
            <h3 className={styles.questionTitle}>{current.title}</h3>
            <div className={styles.quizOptions}>
              {current.options.map((option, index) => (
                <button
                  key={option}
                  type="button"
                  className={`${styles.option} ${answers[stepIndex] === option ? styles.optionActive : ''}`}
                  onClick={() => handleSelect(option)}
                >
                  <span className={styles.optionIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24" role="img" focusable="false">
                      {getIcon(current.icons[index])}
                    </svg>
                  </span>
                  <span className={styles.optionLabel}>{option}</span>
                </button>
              ))}
            </div>
          </div>
          <div className={styles.quizSummary}>
            <p className="muted">{summary}</p>
          </div>
          <div className={styles.quizFooter}>
            <button className="btn btn-outline" type="button" onClick={goBack} disabled={stepIndex === 0}>
              Atrás
            </button>
            <div className={styles.footerActions}>
              <button className="btn btn-ghost" type="button" onClick={resetQuiz}>
                Reiniciar
              </button>
              <button
                className="btn"
                type="button"
                onClick={handlePrimaryAction}
                disabled={!isLastStep && !answers[stepIndex]}
              >
                {isLastStep ? 'Ver en tienda' : 'Continuar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
