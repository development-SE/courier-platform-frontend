import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import './ProfileDetails.css'

export default function PayoutAccountPage() {
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
        <h1 className="page-title">Счёт для выплат</h1>
      </header>

      <article className="profile-detail-card">
        <h2>Основной счёт</h2>
        <div className="profile-option-list">
          <div className="profile-option">
            <span>Kaspi Gold •••• 2147</span>
            <span className="badge badge--success">Основной</span>
          </div>
        </div>
      </article>

      <article className="profile-detail-card">
        <p>Следующая выплата поступит на этот счёт по расписанию парка.</p>
        <button type="button" className="btn btn--secondary btn--sm" style={{ marginTop: '12px' }}>
          Изменить счёт
        </button>
      </article>
    </section>
  )
}
