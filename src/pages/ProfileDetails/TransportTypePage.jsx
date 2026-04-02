import { useState } from 'react'
import { Check, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import './ProfileDetails.css'

const TRANSPORT_OPTIONS = ['Пешком', 'Велосипед', 'Авто']

export default function TransportTypePage() {
  const navigate = useNavigate()
  const [transport, setTransport] = useState('Авто')

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
        <h1 className="page-title">Тип транспорта</h1>
      </header>

      <article className="profile-detail-card">
        <h2>Выберите основной транспорт</h2>
        <p>Этот параметр влияет на подбор заказов и расчёт времени в пути.</p>
      </article>

      <div className="profile-option-list">
        {TRANSPORT_OPTIONS.map(option => (
          <button
            key={option}
            type="button"
            className={`profile-option${transport === option ? ' profile-option--active' : ''}`}
            onClick={() => setTransport(option)}
          >
            <span>{option}</span>
            {transport === option && <Check size={16} color="#CD5E3D" />}
          </button>
        ))}
      </div>
    </section>
  )
}
