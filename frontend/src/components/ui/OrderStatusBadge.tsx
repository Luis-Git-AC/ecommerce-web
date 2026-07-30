import type { OrderStatus } from '@/types/commerce'
import { getOrderStatusLabel, getOrderTone } from '@/utils/order'
import styles from './OrderStatusBadge.module.css'

type Props = {
  status: OrderStatus
  size?: 'md' | 'lg'
}

export default function OrderStatusBadge({ status, size = 'md' }: Props) {
  const tone = getOrderTone(status)

  return (
    <span className={`${styles.badge} ${styles[tone]} ${size === 'lg' ? styles.lg : ''}`}>
      <span className={styles.dot} aria-hidden="true" />
      {getOrderStatusLabel(status)}
    </span>
  )
}
