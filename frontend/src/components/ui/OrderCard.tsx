import { Link } from 'react-router-dom'
import type { OrderSummary } from '@/types/commerce'
import { formatDate, formatMoney } from '@/utils/format'
import { formatOrderItemCount, formatOrderRef, getOrderStatusLabel } from '@/utils/order'
import OrderProgress from './OrderProgress'
import OrderStatusBadge from './OrderStatusBadge'
import styles from './OrderCard.module.css'

type Props = {
  order: OrderSummary
}

export default function OrderCard({ order }: Props) {
  const needsPayment = order.status === 'pending'
  const paymentFailed = order.status === 'failed'

  return (
    <Link
      to={`/account/orders/${order.id}`}
      className={styles.card}
      aria-label={`Pedido ${formatOrderRef(order.id)}, ${getOrderStatusLabel(order.status)}, ${formatMoney(order.total, order.currency)}`}
    >
      <div className={styles.topRow}>
        <OrderStatusBadge status={order.status} />
        <span className={styles.date}>{formatDate(order.createdAt)}</span>
      </div>

      <div className={styles.amountRow}>
        <span className={styles.total}>{formatMoney(order.total, order.currency)}</span>
        <span className={styles.itemCount}>{formatOrderItemCount(order.totalItems)}</span>
      </div>

      {needsPayment ? (
        <p className={`${styles.alert} ${styles.alertPending}`}>Te falta completar el pago</p>
      ) : null}

      {paymentFailed ? (
        <p className={`${styles.alert} ${styles.alertNegative}`}>
          El pago no se completó. Puedes reintentarlo.
        </p>
      ) : null}

      <div className={styles.timeline}>
        <OrderProgress status={order.status} />
      </div>

      <div className={styles.footRow}>
        <span className={styles.ref}>{formatOrderRef(order.id)}</span>
        <span className={styles.action}>
          Ver detalle
          <svg
            className={styles.chevron}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </span>
      </div>
    </Link>
  )
}
