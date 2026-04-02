import { shifts } from '../../mock/courier'
import './ShiftsPage.css'

export default function ShiftsPage() {
  return (
    <section className="page shifts-page">
      <h1 className="page-title">Shifts</h1>

      <article className="card shifts-next-card">
        <p className="muted">Next shift</p>
        <h2>{shifts.next.day}, {shifts.next.time}</h2>
        <p>{shifts.next.zone}</p>
      </article>

      <section className="card shifts-week-card">
        <div className="shifts-week-card__head">
          <strong>Available shifts</strong>
          <span className="chip">Week</span>
        </div>
        <div className="shift-list">
          {shifts.week.map(item => (
            <article key={item.id} className={`shift-item${item.available ? '' : ' shift-item--disabled'}`}>
              <div>
                <strong>{item.day}</strong>
                <p className="muted">{item.date}</p>
              </div>
              <p>{item.time}</p>
              <button type="button" className="btn-secondary" disabled={!item.available}>
                {item.available ? 'Reserve' : 'Unavailable'}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="card shifts-history-card">
        <strong>History</strong>
        {shifts.history.map(item => (
          <div key={item.id} className="history-item">
            <span>{item.date}</span>
            <span>{item.hours}</span>
            <strong>{item.earnings.toLocaleString('ru-RU')} ₸</strong>
          </div>
        ))}
      </section>
    </section>
  )
}
