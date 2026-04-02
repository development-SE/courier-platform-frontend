import { useNavigate } from 'react-router-dom'
import { ChevronRight, LogOut } from 'lucide-react'
import { getCourierProfile } from '../../services/courierDataService'
import { signOut } from '../../services/authService'
import { ROUTES } from '../../constants/routes'
import { getCourierInitials } from '../../domain/profile/model'
import './ProfilePage.css'

const profileItems = [
  { label: 'Статус на линии', route: ROUTES.PROFILE_STATUS },
  { label: 'Тип транспорта', route: ROUTES.PROFILE_TRANSPORT },
  { label: 'Проверка личности', route: ROUTES.PROFILE_IDENTITY },
  { label: 'Доступ к парку', route: ROUTES.PROFILE_PARK_ACCESS },
  { label: 'Счёт для выплат', route: ROUTES.PROFILE_PAYOUT_ACCOUNT },
  { label: 'История выплат', route: ROUTES.PROFILE_PAYOUT_HISTORY },
  { label: 'Уведомления', route: ROUTES.PROFILE_NOTIFICATIONS },
  { label: 'Язык', route: ROUTES.PROFILE_LANGUAGE },
]

export default function ProfilePage() {
  const navigate = useNavigate()
  const courier = getCourierProfile()

  const handleLogout = () => {
    signOut()
    navigate(ROUTES.SIGN_IN, { replace: true })
  }

  return (
    <section className="page profile-page">
      <h1 className="page-title">Профиль</h1>

      <article className="card profile-identity">
        <div className="profile-identity__avatar">{getCourierInitials(courier)}</div>
        <div>
          <strong>{courier.name} {courier.lastName}</strong>
          <p className="muted">{courier.park}</p>
          <small className="muted">Рейтинг {courier.rating} · Курьер</small>
        </div>
      </article>

      <section className="card profile-group">
        {profileItems.map(item => (
          <button
            key={item.label}
            type="button"
            className="profile-row"
            onClick={() => navigate(item.route)}
          >
            <span>{item.label}</span>
            <ChevronRight size={16} color="#7b7b96" />
          </button>
        ))}
      </section>

      <button type="button" className="btn btn--danger btn--full profile-logout-btn" onClick={handleLogout}>
        <LogOut size={16} />
        Выйти
      </button>
    </section>
  )
}
