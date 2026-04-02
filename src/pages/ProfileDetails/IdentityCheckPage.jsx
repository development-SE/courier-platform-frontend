import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import './ProfileDetails.css'

export default function IdentityCheckPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('confirmed')

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
        <h1 className="page-title">Проверка личности</h1>
      </header>

      <article className="profile-detail-card">
        <div className="profile-inline-row">
          <div>
            <h2>{status === 'confirmed' ? 'Подтверждено' : 'На проверке'}</h2>
            <p>Профиль допущен к работе после успешной проверки документов.</p>
          </div>
          <span
            className={`profile-status-dot ${
              status === 'confirmed' ? 'profile-status-dot--success' : 'profile-status-dot--warning'
            }`}
          />
        </div>
      </article>

      <article className="profile-detail-card">
        <h2>Статус проверки</h2>
        <div className="profile-option-list">
          <button
            type="button"
            className={`profile-option${status === 'confirmed' ? ' profile-option--active' : ''}`}
            onClick={() => setStatus('confirmed')}
          >
            <span>Подтверждено</span>
          </button>
          <button
            type="button"
            className={`profile-option${status === 'pending' ? ' profile-option--active' : ''}`}
            onClick={() => setStatus('pending')}
          >
            <span>На проверке</span>
          </button>
        </div>
      </article>
    </section>
  )
}
