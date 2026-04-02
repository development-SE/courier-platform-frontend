import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import './ProfileDetails.css'

export default function NotificationsSettingsPage() {
  const navigate = useNavigate()
  const [pushEnabled, setPushEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [serviceEnabled, setServiceEnabled] = useState(false)

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
        <h1 className="page-title">Уведомления</h1>
      </header>

      <article className="profile-detail-card profile-option-list">
        <div className="profile-inline-row">
          <span>Push-уведомления</span>
          <button
            type="button"
            className={`profile-toggle${pushEnabled ? ' profile-toggle--active' : ''}`}
            onClick={() => setPushEnabled(prev => !prev)}
          />
        </div>
        <div className="profile-inline-row">
          <span>Звуковые сигналы</span>
          <button
            type="button"
            className={`profile-toggle${soundEnabled ? ' profile-toggle--active' : ''}`}
            onClick={() => setSoundEnabled(prev => !prev)}
          />
        </div>
        <div className="profile-inline-row">
          <span>Сервисные сообщения</span>
          <button
            type="button"
            className={`profile-toggle${serviceEnabled ? ' profile-toggle--active' : ''}`}
            onClick={() => setServiceEnabled(prev => !prev)}
          />
        </div>
      </article>
    </section>
  )
}
