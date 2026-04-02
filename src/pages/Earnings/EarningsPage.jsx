import { earnings } from '../../mock/courier'
import './EarningsPage.css'

const maxValue = Math.max(...earnings.chart.map(item => item.value))

export default function EarningsPage() {
  const progress = Math.min((earnings.periodAmount / earnings.goal) * 100, 100)

  return (
    <section className="page earnings-page">
      <h1 className="page-title">Earnings</h1>

      <article className="card earnings-summary">
        <p className="muted">Current period</p>
        <h2>{earnings.periodAmount.toLocaleString('ru-RU')} ₸</h2>
        <div className="earnings-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
        <small className="muted">Goal: {earnings.goal.toLocaleString('ru-RU')} ₸</small>
      </article>

      <section className="card earnings-metrics">
        <div>
          <p className="muted">Balance</p>
          <strong>{earnings.balance.toLocaleString('ru-RU')} ₸</strong>
        </div>
        <div>
          <p className="muted">Next payout</p>
          <strong>{earnings.nextPayoutDate}</strong>
        </div>
      </section>

      <section className="card earnings-chart">
        <strong>Week trend</strong>
        <div className="bars">
          {earnings.chart.map(item => (
            <div key={item.day} className="bar-item">
              <div className="bar-track">
                <span style={{ height: `${(item.value / maxValue) * 100}%` }} />
              </div>
              <small>{item.day}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card earnings-breakdown">
        <strong>Breakdown</strong>
        <div className="breakdown-row"><span>Delivery fees</span><b>{earnings.breakdown.deliveryFees.toLocaleString('ru-RU')} ₸</b></div>
        <div className="breakdown-row"><span>Bonuses</span><b>{earnings.breakdown.bonuses.toLocaleString('ru-RU')} ₸</b></div>
        <div className="breakdown-row"><span>Tips</span><b>{earnings.breakdown.tips.toLocaleString('ru-RU')} ₸</b></div>
        <div className="breakdown-row"><span>Penalties</span><b className="negative">-{earnings.breakdown.penalties.toLocaleString('ru-RU')} ₸</b></div>
      </section>

      <section className="card earnings-transactions">
        <strong>Transactions</strong>
        {earnings.transactions.map(item => (
          <div key={item.id} className="tx-row">
            <div>
              <p>{item.title}</p>
              <small className="muted">{item.date}</small>
            </div>
            <strong className={item.type === 'minus' ? 'negative' : 'positive'}>
              {item.type === 'minus' ? '-' : '+'}{item.amount.toLocaleString('ru-RU')} ₸
            </strong>
          </div>
        ))}
      </section>
    </section>
  )
}
