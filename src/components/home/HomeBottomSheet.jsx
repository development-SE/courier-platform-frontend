import { useEffect, useCallback } from 'react'
import {
  Phone, MessageCircle, X, ChevronUp,
  MapPin, Package, Clock, CreditCard, Hash, MessageSquare,
  CheckCircle2,
} from 'lucide-react'
import { useBottomSheet, SNAP } from '../../hooks/useBottomSheet'
import './HomeBottomSheet.css'

/* ─────────────────────────────────────────────
   Order step config — drives labels + CTA
───────────────────────────────────────────── */
const STEP_CFG = {
  to_pickup: {
    badge:    'К отправителю',
    badgeKey: 'pickup',
    cta:      'Я на месте',
    next:     'arrived_pickup',
  },
  arrived_pickup: {
    badge:    'У отправителя',
    badgeKey: 'arrived',
    cta:      'Забрал посылку',
    next:     'to_customer',
  },
  to_customer: {
    badge:    'К получателю',
    badgeKey: 'delivery',
    cta:      'Доставлено',
    next:     'delivered',
  },
  delivered: {
    badge:    'Доставлено ✓',
    badgeKey: 'done',
    cta:      null,
    next:     null,
  },
}

const PAYMENT_LABEL = { cashless: 'Безналичная', cash: 'Наличные' }

/* ─────────────────────────────────────────────
   DragHandle
───────────────────────────────────────────── */
function DragHandle({ dragProps, onExpandToggle, isExpanded }) {
  return (
    <div className="hbs__handle-zone" {...dragProps}>
      <div className="hbs__handle-pill" />
      <button
        type="button"
        className={`hbs__expand-btn ${isExpanded ? 'hbs__expand-btn--flip' : ''}`}
        onClick={onExpandToggle}
        aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}
      >
        <ChevronUp size={16} strokeWidth={2.5} />
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Idle card (no active order)
───────────────────────────────────────────── */
function IdleCard({ courierStatus, summary, onGoOnline, onGoOffline }) {
  const isOnline = courierStatus === 'online'

  return (
    <div className="hbs__idle">
      <div className="hbs__summary-row">
        <div className="hbs__summary-item">
          <span className="hbs__summary-label">Доход сегодня</span>
          <span className="hbs__summary-value">{summary.todayIncome.toLocaleString('ru-RU')} ₸</span>
        </div>
        <div className="hbs__summary-sep" />
        <div className="hbs__summary-item">
          <span className="hbs__summary-label">Заказов</span>
          <span className="hbs__summary-value">{summary.todayOrders}</span>
        </div>
        <div className="hbs__summary-sep" />
        <div className="hbs__summary-item">
          <span className="hbs__summary-label">След. смена</span>
          <span className="hbs__summary-value">{summary.nextShift}</span>
        </div>
      </div>

      {isOnline ? (
        <div className="hbs__waiting">
          <span className="hbs__waiting-dot" />
          <span>Ожидание заказа…</span>
        </div>
      ) : null}

      <button
        type="button"
        className={`hbs__cta-btn ${isOnline ? 'hbs__cta-btn--stop' : ''}`}
        onClick={isOnline ? onGoOffline : onGoOnline}
      >
        {isOnline ? 'Завершить смену' : 'Выйти на линию'}
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Order collapsed strip (snapIndex === 0)
───────────────────────────────────────────── */
function OrderStrip({ order, step, onExpand }) {
  const cfg = STEP_CFG[step] ?? STEP_CFG.to_pickup
  return (
    <button type="button" className="hbs__order-strip" onClick={onExpand}>
      <span className={`hbs__order-badge hbs__order-badge--${cfg.badgeKey}`}>{cfg.badge}</span>
      <span className="hbs__order-strip-addr">{order.pickupAddress}</span>
      <span className="hbs__order-strip-fee">+{order.earnings} ₸</span>
    </button>
  )
}

/* ─────────────────────────────────────────────
   Full order card (snapIndex ≥ 1)
───────────────────────────────────────────── */
function OrderCard({ order, step, onStepAdvance, onCancelOrder, onCallSupport, onChatSupport, isExpanded }) {
  const cfg = STEP_CFG[step] ?? STEP_CFG.to_pickup

  const showDelivery = step === 'to_customer' || step === 'delivered'
  const isDone       = step === 'delivered'

  return (
    <div className="hbs__order-card">
      {/* Header */}
      <div className="hbs__order-header">
        <div>
          <span className={`hbs__order-badge hbs__order-badge--${cfg.badgeKey}`}>{cfg.badge}</span>
          <p className="hbs__order-num">Заказ #{order.id}</p>
        </div>
        <div className="hbs__order-eta">
          <Clock size={13} strokeWidth={2} />
          <span>{order.pickupDeadline}</span>
        </div>
      </div>

      {/* Client */}
      <div className="hbs__order-row">
        <Package size={15} strokeWidth={2} className="hbs__row-icon" />
        <div>
          <p className="hbs__row-label">Клиент / магазин</p>
          <p className="hbs__row-value">{order.client}</p>
        </div>
      </div>

      {/* Address */}
      <div className="hbs__order-row">
        <MapPin size={15} strokeWidth={2} className="hbs__row-icon" />
        <div>
          <p className="hbs__row-label">{showDelivery ? 'Адрес доставки' : 'Адрес получения'}</p>
          <p className="hbs__row-value">
            {showDelivery ? order.deliveryAddress : order.pickupAddress}
          </p>
        </div>
      </div>

      {/* Pickup code (only to_pickup / arrived) */}
      {!showDelivery && order.pickupCode && (
        <div className="hbs__order-row">
          <Hash size={15} strokeWidth={2} className="hbs__row-icon" />
          <div>
            <p className="hbs__row-label">Код получения</p>
            <p className="hbs__row-value hbs__row-value--code">{order.pickupCode}</p>
          </div>
        </div>
      )}

      {/* Expanded-only details */}
      {isExpanded && (
        <>
          {order.comment ? (
            <div className="hbs__order-row">
              <MessageSquare size={15} strokeWidth={2} className="hbs__row-icon" />
              <div>
                <p className="hbs__row-label">Комментарий</p>
                <p className="hbs__row-value">{order.comment}</p>
              </div>
            </div>
          ) : null}

          <div className="hbs__order-meta-row">
            <div className="hbs__meta-chip">
              <Package size={12} strokeWidth={2} />
              {order.parcelsCount} {order.parcelsCount === 1 ? 'посылка' : 'посылки'}
            </div>
            <div className="hbs__meta-chip">
              <CreditCard size={12} strokeWidth={2} />
              {PAYMENT_LABEL[order.payment] ?? order.payment}
            </div>
            <div className="hbs__meta-chip hbs__meta-chip--earn">
              +{order.earnings} ₸
            </div>
          </div>

          {/* Support actions */}
          <div className="hbs__support-row">
            <button type="button" className="hbs__support-btn" onClick={onCallSupport}>
              <Phone size={16} strokeWidth={2} />
              Позвонить
            </button>
            <button type="button" className="hbs__support-btn" onClick={onChatSupport}>
              <MessageCircle size={16} strokeWidth={2} />
              Написать
            </button>
            <button type="button" className="hbs__support-btn hbs__support-btn--danger" onClick={onCancelOrder}>
              <X size={16} strokeWidth={2} />
              Отменить
            </button>
          </div>
        </>
      )}

      {/* Delivered success */}
      {isDone && (
        <div className="hbs__done-banner">
          <CheckCircle2 size={22} strokeWidth={2} />
          <span>Заказ доставлен! Отличная работа</span>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   HomeBottomSheet — main export
───────────────────────────────────────────── */
export default function HomeBottomSheet({
  courierStatus,
  activeOrder,
  orderStep,
  summary,
  onGoOnline,
  onGoOffline,
  onStepAdvance,
  onCancelOrder,
}) {
  const { height, snapIndex, isDragging, dragHandleProps, snapTo, halfOpen, expand, collapse, isExpanded, isCollapsed } =
    useBottomSheet(SNAP.HALF)

  /* Snap to half automatically when an order becomes active */
  useEffect(() => {
    if (activeOrder && isCollapsed) halfOpen()
  }, [activeOrder, isCollapsed, halfOpen])

  /* Snap to half when order is cleared */
  useEffect(() => {
    if (!activeOrder) halfOpen()
  }, [activeOrder, halfOpen])

  const handleExpandToggle = useCallback(() => {
    isExpanded ? halfOpen() : expand()
  }, [isExpanded, halfOpen, expand])

  const handleStripExpand = useCallback(() => {
    halfOpen()
  }, [halfOpen])

  const handleCallSupport = useCallback(() => {
    /* placeholder — open dialer / navigate to support */
    alert('Звонок в поддержку')
  }, [])

  const handleChatSupport = useCallback(() => {
    alert('Чат с поддержкой')
  }, [])

  const cfg        = activeOrder ? (STEP_CFG[orderStep] ?? STEP_CFG.to_pickup) : null
  const showStrip  = activeOrder && isCollapsed
  const showCard   = activeOrder && !isCollapsed

  return (
    <div
      className={`hbs ${isDragging ? 'hbs--dragging' : ''}`}
      style={{ height: `${height}px` }}
    >
      <DragHandle
        dragProps={dragHandleProps}
        onExpandToggle={handleExpandToggle}
        isExpanded={isExpanded}
      />

      <div className="hbs__body">
        {/* ── No active order ── */}
        {!activeOrder && (
          <IdleCard
            courierStatus={courierStatus}
            summary={summary}
            onGoOnline={onGoOnline}
            onGoOffline={onGoOffline}
          />
        )}

        {/* ── Active order — collapsed strip ── */}
        {showStrip && (
          <OrderStrip
            order={activeOrder}
            step={orderStep}
            onExpand={handleStripExpand}
          />
        )}

        {/* ── Active order — half / expanded card ── */}
        {showCard && (
          <div className="hbs__scroll">
            <OrderCard
              order={activeOrder}
              step={orderStep}
              isExpanded={isExpanded}
              onStepAdvance={onStepAdvance}
              onCancelOrder={onCancelOrder}
              onCallSupport={handleCallSupport}
              onChatSupport={handleChatSupport}
            />
          </div>
        )}
      </div>

      {/* ── Sticky CTA ── */}
      {activeOrder && cfg?.cta && (
        <div className="hbs__cta-wrap">
          <button type="button" className="hbs__cta-btn" onClick={onStepAdvance}>
            {cfg.cta}
          </button>
        </div>
      )}

      {/* ── Idle CTA already inside IdleCard ── */}
    </div>
  )
}
