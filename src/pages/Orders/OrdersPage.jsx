import { Package, ChevronRight, Clock, CheckCircle2, XCircle, Truck } from 'lucide-react'
import { ORDER_FILTERS, useOrdersViewModel } from './useOrdersViewModel'
import './OrdersPage.css'

const STATUS_CONFIG = {
  new: { label: 'Новый', className: 'badge--info', Icon: Package },
  pickup: { label: 'К отправителю', className: 'badge--warning', Icon: Truck },
  delivery: { label: 'К получателю', className: 'badge--brand', Icon: Truck },
  done: { label: 'Выполнен', className: 'badge--success', Icon: CheckCircle2 },
  cancelled: { label: 'Отменён', className: 'badge--error', Icon: XCircle },
}

const DELIVERY_TYPE = {
  door_to_door: 'От двери до двери',
  pickup_point: 'Пункт выдачи',
}

function OrderCard({ order, onOpen }) {
  const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, className: 'badge--neutral', Icon: Package }
  const deliveryTypeLabel = DELIVERY_TYPE[order.deliveryType] ?? 'От двери до двери'

  return (
    <article
      className="order-card"
      onClick={() => onOpen(order.id)}
      role="button"
      tabIndex={0}
      onKeyDown={event => event.key === 'Enter' && onOpen(order.id)}
      aria-label={`Заказ ${order.id} - ${order.client}`}
    >
      <div className="order-card__top">
        <span className={`badge ${cfg.className}`}>
          <cfg.Icon size={11} strokeWidth={2.5} />
          {cfg.label}
        </span>
        {order.earnings > 0 ? (
          <span className="order-card__earnings">+{order.earnings.toLocaleString('ru-RU')} ₸</span>
        ) : (
          <span className="order-card__earnings order-card__earnings--zero">-</span>
        )}
      </div>

      <div className="order-card__client">{order.client}</div>

      <div className="order-card__meta">
        <span>{deliveryTypeLabel}</span>
        <span className="order-card__meta-sep" />
        <span>{order.pointsCount} точки</span>
        <span className="order-card__meta-sep" />
        <span>{order.distance}</span>
      </div>

      <div className="order-card__route">
        <div className="order-card__route-item">
          <span className="order-card__route-dot order-card__route-dot--from" />
          <span className="order-card__route-addr">{order.pickupAddress}</span>
        </div>
        <div className="order-card__route-line" />
        <div className="order-card__route-item">
          <span className="order-card__route-dot order-card__route-dot--to" />
          <span className="order-card__route-addr">{order.deliveryAddress}</span>
        </div>
      </div>

      <div className="order-card__footer">
        <div className="order-card__time">
          <Clock size={13} strokeWidth={2} />
          <span>
            {order.pickupDeadline} - {order.deliveryDeadline}
          </span>
        </div>
        <ChevronRight size={16} strokeWidth={2} className="order-card__chevron" />
      </div>
    </article>
  )
}

export default function OrdersPage() {
  const {
    filter,
    setFilter,
    filteredOrders,
    activeOrdersCount,
    openOrderDetails,
  } = useOrdersViewModel()

  return (
    <div className="orders-page">
      <header className="page-header orders-page__header">
        <h1 className="page-title">Заказы</h1>
        {activeOrdersCount > 0 && <span className="badge badge--warning">{activeOrdersCount} активных</span>}
      </header>

      <div className="orders-page__filters scroll-hidden">
        {ORDER_FILTERS.map(filterItem => (
          <button
            key={filterItem.key}
            type="button"
            className={`orders-page__filter-btn${filter === filterItem.key ? ' orders-page__filter-btn--active' : ''}`}
            onClick={() => setFilter(filterItem.key)}
          >
            {filterItem.label}
          </button>
        ))}
      </div>

      <div className="orders-page__list">
        {filteredOrders.length === 0 ? (
          <div className="orders-page__empty">
            <Package size={40} strokeWidth={1.2} />
            <span>Нет заказов</span>
          </div>
        ) : (
          filteredOrders.map(order => <OrderCard key={order.id} order={order} onOpen={openOrderDetails} />)
        )}
      </div>
    </div>
  )
}
