import type { OrderStatus } from '@/types/commerce'
import { getOrderStatusLabel, getOrderTimeline } from '@/utils/order'
import styles from './OrderProgress.module.css'

type Props = {
  status: OrderStatus
}

export default function OrderProgress({ status }: Props) {
  const steps = getOrderTimeline(status)

  if (steps.length === 0) {
    return null
  }

  return (
    <ol className={styles.progress} aria-label={`Estado del envío: ${getOrderStatusLabel(status)}`}>
      {steps.map((step) => (
        <li
          key={step.status}
          className={`${styles.step} ${step.reached ? styles.reached : ''} ${
            step.current ? styles.current : ''
          }`}
          aria-current={step.current ? 'step' : undefined}
        >
          <span className={styles.dot} aria-hidden="true" />
          <span className={styles.label}>{step.label}</span>
        </li>
      ))}
    </ol>
  )
}
