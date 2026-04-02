import { ChevronDown, ChevronUp, Copy, MessageCircle, Navigation2, Phone, XCircle } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getBalanceSnapshot, getCourierProfile, getSlotsSnapshot } from '../../services/courierDataService'
import { ORDER_STAGES } from './useOrderState'
import { writeTextToClipboard } from '../../platform/clipboard'
import { openPhoneDialer } from '../../platform/phone'
import './ActionSheet.css'

const BALANCE = getBalanceSnapshot()
const COURIER = getCourierProfile()
const SLOTS = getSlotsSnapshot()

const TEXT = {
  offline: 'Не на линии',
  online: 'Готов к выходу',
  busy: 'На заказе',
  endShift: 'Завершить смену',
  goOnline: 'Выйти на линию',
}

const COLLAPSED_HEIGHT = 252

const TODAY = new Date()
  .toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
  .replace(/^./, char => char.toUpperCase())

function getHalfHeight() {
  if (typeof window === 'undefined') return 430
  return Math.min(Math.max(Math.round(window.innerHeight * 0.5), 390), 470)
}

function getExpandedHeight() {
  if (typeof window === 'undefined') return 610
  return Math.min(Math.round(window.innerHeight * 0.8), window.innerHeight - 86)
}

function nearestSnap(value, snapPoints) {
  return snapPoints.reduce((closest, current) => (
    Math.abs(current - value) < Math.abs(closest - value) ? current : closest
  ))
}

function statusHelper(status, hasActiveOrder) {
  if (hasActiveOrder) return 'Есть активный заказ. Проверьте маршрут и таймер.'
  if (status === 'offline') return 'После выхода на линию новые заказы появятся здесь.'
  if (status === 'busy') return 'Вы в процессе доставки. Следите за обновлениями маршрута.'
  return 'Ожидаем новые заказы в вашем парке.'
}

export default function ActionSheet({
  status,
  activating,
  orders,
  activeOrder,
  orderStage,
  stageMeta,
  onToggleOnline,
  onOrderAction,
  onCancelOrder,
  onOpenSlots,
  onOpenSupport,
  onOpenDiagnostics,
  onPrimaryActionIntent,
}) {
  const dragRef = useRef(null)
  const [halfHeight, setHalfHeight] = useState(getHalfHeight)
  const [expandedHeight, setExpandedHeight] = useState(getExpandedHeight)
  const [sheetHeight, setSheetHeight] = useState(COLLAPSED_HEIGHT)
  const [copiedCode, setCopiedCode] = useState(false)

  const hasActiveOrder = Boolean(activeOrder)
  const isOnline = status !== 'offline'
  const showHalfContent = sheetHeight >= halfHeight - 10
  const showExpandedContent = sheetHeight >= expandedHeight - 16

  const snapPoints = useMemo(() => [COLLAPSED_HEIGHT, halfHeight, expandedHeight], [halfHeight, expandedHeight])

  useEffect(() => {
    const onResize = () => {
      const nextHalf = getHalfHeight()
      const nextExpanded = getExpandedHeight()
      setHalfHeight(nextHalf)
      setExpandedHeight(nextExpanded)
      setSheetHeight(prev => {
        const clamped = Math.max(COLLAPSED_HEIGHT, Math.min(prev, nextExpanded))
        return nearestSnap(clamped, [COLLAPSED_HEIGHT, nextHalf, nextExpanded])
      })
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const nextShiftStart = useMemo(() => {
    const nextSlot = SLOTS.find(slot => slot.available)
    if (!nextSlot) return '-'
    const [startTime] = nextSlot.time.split('–')
    return startTime.trim()
  }, [])

  const todayOrders = useMemo(
    () => orders.filter(order => order.status !== 'cancelled').length,
    [orders],
  )

  const stageLabel = hasActiveOrder && stageMeta ? stageMeta.chip : TEXT[status]
  const helperText = hasActiveOrder && stageMeta ? stageMeta.helper : statusHelper(status, false)
  const ctaLabel = hasActiveOrder && stageMeta
    ? stageMeta.primaryAction
    : isOnline
      ? TEXT.endShift
      : TEXT.goOnline

  const addressLabel = orderStage === ORDER_STAGES.TO_CUSTOMER ? 'Адрес доставки' : 'Адрес получения'
  const addressValue = orderStage === ORDER_STAGES.TO_CUSTOMER ? activeOrder?.deliveryAddress : activeOrder?.pickupAddress

  const startDrag = event => {
    dragRef.current = {
      startY: event.clientY,
      startHeight: sheetHeight,
      pointerId: event.pointerId,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const moveDrag = event => {
    if (!dragRef.current) return
    const { startY, startHeight } = dragRef.current
    const delta = startY - event.clientY
    const raw = startHeight + delta
    const clamped = Math.max(COLLAPSED_HEIGHT, Math.min(raw, expandedHeight))
    setSheetHeight(clamped)
  }

  const endDrag = event => {
    if (!dragRef.current) return
    const pointerId = dragRef.current.pointerId
    if (event.currentTarget.hasPointerCapture(pointerId)) {
      event.currentTarget.releasePointerCapture(pointerId)
    }
    dragRef.current = null
    setSheetHeight(prev => nearestSnap(prev, snapPoints))
  }

  const toggleSheet = () => {
    if (sheetHeight < halfHeight) {
      setSheetHeight(halfHeight)
      return
    }
    if (sheetHeight < expandedHeight) {
      setSheetHeight(expandedHeight)
      return
    }
    setSheetHeight(COLLAPSED_HEIGHT)
  }

  const handleCopyCode = async () => {
    if (!activeOrder?.pickupCode) return
    await writeTextToClipboard(activeOrder.pickupCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 1600)
  }

  const handleCallSupport = () => {
    openPhoneDialer('+77070000000')
  }

  return (
    <div className="action-sheet" style={{ height: `${sheetHeight}px` }}>
      <div
        className="action-sheet__topbar"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span className="action-sheet__drag-handle" />
        <button
          type="button"
          className="action-sheet__collapse-btn"
          onClick={toggleSheet}
          aria-label="Изменить высоту карточки"
        >
          {sheetHeight >= expandedHeight - 1 ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      <div className="action-sheet__scroll">
        <div className="action-sheet__status-block">
          <span className={`action-sheet__status-pill status-pill--${hasActiveOrder ? 'busy' : status}`}>
            <span className="action-sheet__status-dot" />
            {stageLabel}
          </span>
          <p className="action-sheet__status-helper">{helperText}</p>
        </div>

        <div className="action-sheet__kpi-grid">
          <div className="action-sheet__kpi-item">
            <span className="action-sheet__kpi-label">Доход сегодня</span>
            <strong className="action-sheet__kpi-value">{BALANCE.today.toLocaleString('ru-RU')} ₸</strong>
          </div>
          <div className="action-sheet__kpi-item">
            <span className="action-sheet__kpi-label">Заказов</span>
            <strong className="action-sheet__kpi-value">{todayOrders}</strong>
          </div>
          <div className="action-sheet__kpi-item">
            <span className="action-sheet__kpi-label">След. смена</span>
            <strong className="action-sheet__kpi-value">{nextShiftStart}</strong>
          </div>
        </div>

        <button
          type="button"
          className={`action-sheet__cta${isOnline && !hasActiveOrder ? ' action-sheet__cta--stop' : ''}${activating ? ' action-sheet__cta--loading' : ''}`}
          onClick={hasActiveOrder ? onOrderAction : onToggleOnline}
          onPointerDown={onPrimaryActionIntent}
          onMouseEnter={onPrimaryActionIntent}
          onFocus={onPrimaryActionIntent}
          disabled={activating}
          aria-label={ctaLabel}
        >
          {activating ? <span className="spinner" /> : ctaLabel}
        </button>

        {showHalfContent && !hasActiveOrder && (
          <>
            <div className="action-sheet__quick-actions">
              <button type="button" className="action-sheet__quick-btn" onClick={onOpenSlots}>
                Смены
              </button>
              <button type="button" className="action-sheet__quick-btn" onClick={onOpenSupport}>
                Поддержка
              </button>
              <button type="button" className="action-sheet__quick-btn" onClick={onOpenDiagnostics}>
                Диагностика
              </button>
            </div>

            <div className="action-sheet__info-block">
              <div className="action-sheet__info-row">
                <span>Парк</span>
                <strong>{COURIER.park}</strong>
              </div>
              <div className="action-sheet__info-row">
                <span>{TODAY}</span>
                <span>{statusHelper(status, false)}</span>
              </div>
            </div>
          </>
        )}

        {showHalfContent && hasActiveOrder && (
          <section className="action-sheet__active-order">
            <header className="action-sheet__active-head">
              <div>
                <strong className="action-sheet__active-eta">{stageMeta?.eta ?? activeOrder.pickupEta}</strong>
                <p className="action-sheet__active-stage">{stageLabel}</p>
              </div>
              <button type="button" className="action-sheet__icon-btn" onClick={handleCallSupport} aria-label="Позвонить">
                <Phone size={16} />
              </button>
            </header>

            <div className="action-sheet__field">
              <span>Номер заказа</span>
              <strong className="action-sheet__field-main">{activeOrder.number}</strong>
            </div>

            <div className="action-sheet__field">
              <span>Клиент</span>
              <strong className="action-sheet__field-main">{activeOrder.client}</strong>
            </div>

            <div className="action-sheet__field action-sheet__field--row">
              <div className="action-sheet__address-block">
                <span>{addressLabel}</span>
                <strong className="action-sheet__field-main">{addressValue}</strong>
              </div>
              <button type="button" className="action-sheet__nav-chip">
                <Navigation2 size={14} />
                Навигация
              </button>
            </div>

            {orderStage !== ORDER_STAGES.TO_CUSTOMER && (
              <div className="action-sheet__field action-sheet__field--row">
                <div>
                  <span>Код получения</span>
                  <strong className="action-sheet__pickup-code">{activeOrder.pickupCode}</strong>
                </div>
                <button type="button" className="action-sheet__copy-btn" onClick={handleCopyCode}>
                  <Copy size={14} />
                  {copiedCode ? 'Скопировано' : 'Копировать'}
                </button>
              </div>
            )}

            {showExpandedContent && (
              <div className="action-sheet__field action-sheet__field--split compact">
                <div>
                  <span>Посылок</span>
                  <strong>{activeOrder.parcelsCount}</strong>
                </div>
                <div>
                  <span>Оплата</span>
                  <strong>{activeOrder.paymentType}</strong>
                </div>
              </div>
            )}

            {showExpandedContent ? (
              <div className="action-sheet__support-row">
                <button type="button" className="action-sheet__support-btn" onClick={handleCallSupport}>
                  <Phone size={15} />
                  Позвонить в поддержку
                </button>
                <button type="button" className="action-sheet__support-btn" onClick={onOpenSupport}>
                  <MessageCircle size={15} />
                  Написать в поддержку
                </button>
                <button
                  type="button"
                  className="action-sheet__support-btn action-sheet__support-btn--danger action-sheet__support-btn--wide"
                  onClick={onCancelOrder}
                >
                  <XCircle size={15} />
                  Отменить заказ
                </button>
              </div>
            ) : (
              <div className="action-sheet__support-inline">
                <button type="button" className="action-sheet__support-inline-btn" onClick={handleCallSupport}>
                  <Phone size={14} />
                  Поддержка
                </button>
                <button type="button" className="action-sheet__support-inline-btn" onClick={onOpenSupport}>
                  <MessageCircle size={14} />
                  Чат
                </button>
                <button type="button" className="action-sheet__support-inline-btn action-sheet__support-inline-btn--danger" onClick={onCancelOrder}>
                  <XCircle size={14} />
                  Отмена
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
