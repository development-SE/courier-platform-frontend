import { X, Check, MapPin, Clock, Truck } from 'lucide-react'
import './IncomingOrderModal.css'

export default function IncomingOrderModal({ order, onAccept, onSkip }) {
  return (
    <div className="incoming-overlay" role="dialog" aria-modal="true" aria-label="Входящий заказ">
      <div className="incoming-modal">
        <div className="incoming-modal__handle" />

        <div className="incoming-modal__header">
          <span className="incoming-modal__label">Новый заказ</span>
          <div className="incoming-modal__earnings">+{order.earnings} ₸</div>
        </div>

        <div className="incoming-modal__stats">
          <div className="incoming-modal__stat">
            <Clock size={14} strokeWidth={2} />
            <span>~{order.estimatedMin} мин</span>
          </div>
          <div className="incoming-modal__stat-dot" />
          <div className="incoming-modal__stat">
            <MapPin size={14} strokeWidth={2} />
            <span>{order.distance}</span>
          </div>
          <div className="incoming-modal__stat-dot" />
          <div className="incoming-modal__stat">
            <Truck size={14} strokeWidth={2} />
            <span>{order.pointsCount} точки</span>
          </div>
        </div>

        <div className="incoming-modal__tag">От двери до двери</div>

        <div className="incoming-modal__address-block">
          <div className="incoming-modal__address-label">Откуда забрать</div>
          <div className="incoming-modal__address-value">{order.pickupAddress}</div>
        </div>

        <div className="incoming-modal__priority-row">
          <span className="incoming-modal__priority incoming-modal__priority--gain">
            Принять: приоритет +{order.priorityGain}
          </span>
          <span className="incoming-modal__priority incoming-modal__priority--loss">
            Пропустить: приоритет -{order.priorityLoss}
          </span>
        </div>

        <div className="incoming-modal__actions">
          <button
            type="button"
            className="btn btn--secondary incoming-modal__skip-btn"
            onClick={onSkip}
            aria-label="Пропустить заказ"
          >
            <X size={18} strokeWidth={2} />
            Пропустить
          </button>
          <button
            type="button"
            className="btn btn--primary incoming-modal__accept-btn"
            onClick={onAccept}
            aria-label="Принять заказ"
          >
            <Check size={18} strokeWidth={2.5} />
            Принять заказ
          </button>
        </div>
      </div>
    </div>
  )
}
