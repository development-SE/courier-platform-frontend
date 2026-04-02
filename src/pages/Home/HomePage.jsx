import { Link } from 'react-router-dom'
import { buildOrderDetailRoute } from '../../constants/routes'
import CourierMap from '../../components/map/CourierMap'
import { activeOrder, availableOrders, courierProfile, homeSummary } from '../../mock/courier'
import './HomePage.css'

export default function HomePage() {
  return (
    <section className="home-page">
      <div className="home-page__map-wrap">
        <CourierMap className="home-page__map" />

        <div className="home-status card">
          <div>
            <p className="home-status__label">Line status</p>
            <h1>Offline</h1>
            <p className="muted">{courierProfile.park}</p>
          </div>
          <button type="button" className="btn-secondary">Quick check</button>
        </div>

        <button type="button" className="home-primary-cta btn-primary">
          Выйти на линию
        </button>

        <div className="home-bottom-sheet card">
          <div className="home-bottom-sheet__summary">
            <div>
              <p className="muted">Income today</p>
              <strong>{homeSummary.todayIncome.toLocaleString('ru-RU')} ₸</strong>
            </div>
            <div>
              <p className="muted">Orders</p>
              <strong>{homeSummary.todayOrders}</strong>
            </div>
            <div>
              <p className="muted">Next shift</p>
              <strong>{courierProfile.nextShift}</strong>
            </div>
          </div>

          <div className="home-bottom-sheet__active">
            <div>
              <p className="muted">Active order preview</p>
              <h3>{activeOrder.id}</h3>
              <p>{activeOrder.pickup} → {activeOrder.dropoff}</p>
            </div>
            <Link to={buildOrderDetailRoute(activeOrder.id)} className="btn-secondary">Open</Link>
          </div>

          <div className="home-bottom-sheet__orders">
            {availableOrders.map(order => (
              <article key={order.id} className="order-mini-card">
                <p className="order-mini-card__id">{order.id}</p>
                <p>{order.pickup}</p>
                <p className="muted">{order.distanceKm} km · {order.etaMin} min</p>
                <strong>{order.fee.toLocaleString('ru-RU')} ₸</strong>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

