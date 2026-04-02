import { Clock3, MapPin, PackageCheck } from 'lucide-react'
import CourierMap from '../../components/map/CourierMap'
import { activeOrder } from '../../mock/courier'
import './ActiveOrderPage.css'

export default function ActiveOrderPage() {
  return (
    <section className="active-order-page page">
      <h1 className="page-title">Active Order</h1>

      <div className="active-order-page__map card">
        <CourierMap />
      </div>

      <div className="active-order-page__details card">
        <div className="active-order-page__header">
          <strong>{activeOrder.id}</strong>
          <span className="chip"><Clock3 size={13} /> {activeOrder.timer}</span>
        </div>

        <div className="active-order-page__addresses">
          <p><MapPin size={14} /> <b>Pickup:</b> {activeOrder.pickup}</p>
          <p><MapPin size={14} /> <b>Dropoff:</b> {activeOrder.dropoff}</p>
        </div>

        <div className="active-order-page__meta">
          <span>Fee: {activeOrder.fee.toLocaleString('ru-RU')} ₸</span>
          <span>Payment: {activeOrder.paymentType}</span>
        </div>

        <div className="status-stepper">
          {activeOrder.steps.map(step => (
            <div key={step.key} className={`status-stepper__item${step.done ? ' status-stepper__item--done' : ''}`}>
              <span />
              <small>{step.label}</small>
            </div>
          ))}
        </div>

        <button type="button" className="btn-primary btn--full">
          <PackageCheck size={16} /> Confirm Pickup
        </button>
      </div>
    </section>
  )
}

