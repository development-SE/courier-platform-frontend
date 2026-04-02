import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getCourierProfile } from '../../services/courierDataService'
import { ROUTES } from '../../constants/routes'
import { isCourierOnlineStatus } from '../../domain/profile/model'
import './ProfileDetails.css'

export default function CourierStatusPage() {
  const navigate = useNavigate()
  const courier = getCourierProfile()
  const [isOnline, setIsOnline] = useState(isCourierOnlineStatus(courier.status))

  return (
    <section className="page profile-detail-page">
      <header className="profile-detail-header">
        <button type="button" className="profile-detail-back" onClick={() => navigate(ROUTES.PROFILE)} aria-label="Назад">
          <ChevronLeft size={18} />
        </button>
        <h1 className="page-title">Статус на линии</h1>
      </header>

      <article className="profile-detail-card">
        <div className="profile-inline-row">
          <div>
            <h2>{isOnline ? 'Вы на линии' : 'Вы не на линии'}</h2>
            <p>Переключайте статус перед началом и завершением смены.</p>
          </div>
          <button
            type="button"
            className={`profile-toggle${isOnline ? ' profile-toggle--active' : ''}`}
            onClick={() => setIsOnline(prev => !prev)}
            aria-label="Переключить статус"
          />
        </div>
      </article>
    </section>
  )
}
