import { lazy, Suspense } from 'react'
import ActionSheet from './ActionSheet'
import IncomingOrderModal from './IncomingOrderModal'
import { loadCourierMap } from '../../components/map/loadCourierMap'
import { useDashboardViewModel } from './useDashboardViewModel'
import './DashboardPage.css'

const CourierMap = lazy(loadCourierMap)

export default function DashboardPage() {
  const {
    courier,
    incomingOrder,
    status,
    showIncoming,
    activating,
    shouldLoadMap,
    orders,
    activeOrder,
    orderStage,
    hasActiveOrder,
    stageMeta,
    setShouldLoadMap,
    onToggleOnline,
    onAcceptIncoming,
    onSkipIncoming,
    onOrderAction,
    onCancelOrder,
    onOpenSlots,
    onOpenSupport,
    onOpenDiagnostics,
    onMapIntent,
  } = useDashboardViewModel()

  return (
    <div className="dashboard">
      <div
        className={`dashboard__score score--${status}`}
        aria-label={`Рейтинг ${courier.score}, статус: ${status}`}
      >
        <span className="dashboard__score-value">+{courier.score}</span>
        <span className="dashboard__score-dot" />
      </div>

      {shouldLoadMap ? (
        <Suspense fallback={<div className="dashboard__map" />}>
          <CourierMap className="dashboard__map" />
        </Suspense>
      ) : (
        <div className="dashboard__map dashboard__map-placeholder">
          <button
            type="button"
            className="dashboard__map-load-btn"
            onPointerDown={onMapIntent}
            onMouseEnter={onMapIntent}
            onFocus={onMapIntent}
            onClick={() => setShouldLoadMap(true)}
          >
            Показать карту
          </button>
        </div>
      )}

      <ActionSheet
        status={status}
        activating={activating}
        orders={orders}
        activeOrder={activeOrder}
        orderStage={orderStage}
        stageMeta={stageMeta}
        onToggleOnline={onToggleOnline}
        onOrderAction={onOrderAction}
        onCancelOrder={onCancelOrder}
        onOpenSlots={onOpenSlots}
        onOpenSupport={onOpenSupport}
        onOpenDiagnostics={onOpenDiagnostics}
        onPrimaryActionIntent={onMapIntent}
      />

      {showIncoming && !hasActiveOrder && incomingOrder && (
        <IncomingOrderModal
          order={incomingOrder}
          onAccept={onAcceptIncoming}
          onSkip={onSkipIncoming}
        />
      )}
    </div>
  )
}
