import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Volume2,
  Phone,
  Navigation2,
  Package,
  MessageCircle,
  XCircle,
  Copy,
  CheckCheck,
} from 'lucide-react'
import { useOrdersState } from '../../state/OrdersContext'
import { writeTextToClipboard } from '../../platform/clipboard'
import './OrderDetailPage.css'

const STATUS_SEQUENCE = { pickup: 'delivery', delivery: 'done' }

const ACTION_LABEL = {
  pickup: 'Я на месте',
  delivery: 'Доставлено',
  done: 'Заказ выполнен',
  cancelled: 'Заказ отменён',
  new: 'Принять заказ',
}

const DELIVERY_TYPE_LABEL = {
  door_to_door: 'От двери до двери',
  pickup_point: 'Пункт выдачи',
}

const PAYMENT_LABEL = {
  cashless: 'Безналичная оплата',
  cash: 'Наличные',
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { orders, updateOrderStatus } = useOrdersState()
  const order = orders.find(item => item.id === id)

  const [confirmed, setConfirmed] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  useEffect(() => {
    setConfirmed(false)
  }, [order?.status])

  if (!order) {
    return (
      <div className="order-detail order-detail--missing">
        <button type="button" className="order-detail__back" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} strokeWidth={2} />
        </button>
        <Package size={48} strokeWidth={1} />
        <p>Заказ не найден</p>
      </div>
    )
  }

  const status = order.status
  const isActive = status === 'pickup' || status === 'delivery'
  const actionLabel = ACTION_LABEL[status]

  const handleAction = () => {
    if (!isActive) return
    if (!confirmed) {
      setConfirmed(true)
      return
    }

    const next = STATUS_SEQUENCE[status]
    if (!next) return
    updateOrderStatus(order.id, next)
  }

  const handleCopyCode = async () => {
    if (!order.pickupCode) return
    await writeTextToClipboard(order.pickupCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const currentAddress = status === 'delivery' ? order.deliveryAddress : order.pickupAddress
  const deliveryTypeLabel = DELIVERY_TYPE_LABEL[order.deliveryType] ?? 'От двери до двери'

  return (
    <div className="order-detail">
      <header className="order-detail__header">
        <button type="button" className="order-detail__back" onClick={() => navigate(-1)} aria-label="Назад">
          <ArrowLeft size={22} strokeWidth={2} />
        </button>

        {isActive ? (
          <div className="order-detail__deadline-block">
            <span className="order-detail__deadline-time">
              {status === 'pickup' ? order.pickupDeadline : order.deliveryDeadline}
            </span>
            <span className="order-detail__deadline-label">
              {status === 'pickup' ? 'К отправителю' : 'К получателю'}
            </span>
          </div>
        ) : (
          <span className={`badge ${status === 'done' ? 'badge--success' : 'badge--error'}`}>
            {status === 'done' ? 'Выполнен' : 'Отменён'}
          </span>
        )}

        <button type="button" className="icon-btn" aria-label="Навигация">
          <Volume2 size={20} strokeWidth={1.8} />
        </button>
      </header>

      <div className="order-detail__body">
        <section className="order-detail__section">
          <div className="order-detail__field">
            <span className="order-detail__field-label">Номер заказа</span>
            <div className="order-detail__field-row">
              <span className="order-detail__id">{order.id}</span>
              <button
                type="button"
                className="order-detail__icon-btn"
                onClick={() => { void writeTextToClipboard(order.id) }}
                aria-label="Скопировать номер"
              >
                <Copy size={18} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </section>

        <div className="divider" />

        <section className="order-detail__section">
          <span className="order-detail__field-label">Клиент</span>
          <span className="order-detail__field-value">{order.client}</span>

          <div className="order-detail__tag">
            <Package size={14} strokeWidth={2} />
            {deliveryTypeLabel}
          </div>
        </section>

        <div className="divider" />

        <section className="order-detail__section">
          <div className="order-detail__field-row order-detail__field-row--between">
            <span className="order-detail__field-label">
              {status === 'delivery' ? 'Адрес доставки' : 'Адрес получения'}
            </span>
            <button type="button" className="order-detail__nav-btn" aria-label="Открыть навигацию">
              <Navigation2 size={14} strokeWidth={2} />
              Навигация
            </button>
          </div>
          <span className="order-detail__field-value">{currentAddress}</span>
        </section>

        {order.pickupCode && status === 'pickup' && (
          <>
            <div className="divider" />
            <section className="order-detail__section">
              <span className="order-detail__field-label">Код получения</span>
              <div className="order-detail__code-row">
                <span className="order-detail__code">{order.pickupCode}</span>
                <button
                  type="button"
                  className={`order-detail__copy-btn${codeCopied ? ' order-detail__copy-btn--copied' : ''}`}
                  onClick={handleCopyCode}
                  aria-label="Скопировать код"
                >
                  {codeCopied ? <CheckCheck size={16} strokeWidth={2} /> : <Copy size={16} strokeWidth={2} />}
                  {codeCopied ? 'Скопировано' : 'Копировать'}
                </button>
              </div>
            </section>
          </>
        )}

        {order.comment && (
          <>
            <div className="divider" />
            <section className="order-detail__section">
              <span className="order-detail__field-label">Комментарий</span>
              <p className="order-detail__comment">{order.comment}</p>
            </section>
          </>
        )}

        <div className="divider" />

        <section className="order-detail__section">
          <div className="order-detail__info-row">
            <span className="order-detail__info-label">Посылок у отправителя</span>
            <span className="order-detail__info-value">{order.parcelsCount}</span>
          </div>
        </section>

        <div className="divider" />

        <section className="order-detail__section">
          <div className="order-detail__payment">
            <span className="order-detail__field-value">{PAYMENT_LABEL[order.payment]}</span>
            <span className="order-detail__field-label">включая подачу и ожидание</span>
          </div>
        </section>

        <div className="divider" />

        <section className="order-detail__support">
          <button type="button" className="order-detail__support-item" aria-label="Позвонить в поддержку">
            <Phone size={18} strokeWidth={1.8} className="order-detail__support-icon" />
            <span>Позвонить в поддержку</span>
          </button>
          <div className="divider" />
          <button type="button" className="order-detail__support-item" aria-label="Написать в поддержку">
            <MessageCircle size={18} strokeWidth={1.8} className="order-detail__support-icon" />
            <span>Написать в поддержку</span>
          </button>
          <div className="divider" />
          <button type="button" className="order-detail__support-item order-detail__support-item--danger" aria-label="Отменить заказ">
            <XCircle size={18} strokeWidth={1.8} className="order-detail__support-icon" />
            <span>Отменить заказ</span>
          </button>
        </section>
      </div>

      {isActive && (
        <footer className="order-detail__footer">
          <button
            type="button"
            className={`btn btn--full order-detail__cta${confirmed ? ' order-detail__cta--confirm' : ''}`}
            onClick={handleAction}
            aria-label={actionLabel}
          >
            {confirmed ? `Подтвердить - ${actionLabel}` : actionLabel}
          </button>
        </footer>
      )}
    </div>
  )
}
