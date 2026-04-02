import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getCourierProfile } from '../../services/courierDataService'
import { ROUTES } from '../../constants/routes'
import './ProfileDetails.css'

export default function ParkAccessPage() {
  const navigate = useNavigate()
  const courier = getCourierProfile()

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
        <h1 className="page-title">Доступ к парку</h1>
      </header>

      <article className="profile-detail-card">
        <h2>Текущий парк</h2>
        <p>{courier.park}</p>
      </article>

      <article className="profile-detail-card">
        <div className="profile-inline-row">
          <div>
            <h2>Доступ активен</h2>
            <p>Вы можете принимать заказы внутри выбранного парка.</p>
          </div>
          <span className="badge badge--success">Активен</span>
        </div>
      </article>
    </section>
  )
}
