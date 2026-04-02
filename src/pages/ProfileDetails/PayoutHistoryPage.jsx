import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getBalanceSnapshot } from '../../services/courierDataService'
import { ROUTES } from '../../constants/routes'
import './ProfileDetails.css'

const BALANCE = getBalanceSnapshot()
const PAYOUTS = BALANCE.history.filter(item => item.type === 'payout')

export default function PayoutHistoryPage() {
  const navigate = useNavigate()

  return (
    <section className="page profile-detail-page">
      <header className="profile-detail-header">
        <button
          type="button"
          className="profile-detail-back"
          onClick={() => navigate(ROUTES.PROFILE)}
          aria-label="Назад"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="page-title">История выплат</h1>
      </header>

      <article className="profile-detail-card">
        <h2>Последние операции</h2>
        <ul className="profile-list">
          {PAYOUTS.map(item => (
            <li key={item.id}>
              <strong>{item.label}</strong>
              <small>{item.date}</small>
              <strong>{item.amount.toLocaleString('ru-RU')} ₸</strong>
            </li>
          ))}
          {PAYOUTS.length === 0 && <li><small>Выплат пока нет.</small></li>}
        </ul>
      </article>
    </section>
  )
}
