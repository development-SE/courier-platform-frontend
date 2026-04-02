import { useState } from 'react'
import { Check, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import './ProfileDetails.css'

const LANGUAGES = [
  { code: 'ru', label: 'Русский' },
  { code: 'kk', label: 'Қазақша' },
  { code: 'en', label: 'English' },
]

export default function LanguagePage() {
  const navigate = useNavigate()
  const [language, setLanguage] = useState('ru')

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
        <h1 className="page-title">Язык</h1>
      </header>

      <article className="profile-detail-card">
        <h2>Язык интерфейса</h2>
        <p>Выбранный язык применяется ко всем экранам приложения.</p>
      </article>

      <div className="profile-option-list">
        {LANGUAGES.map(item => (
          <button
            key={item.code}
            type="button"
            className={`profile-option${language === item.code ? ' profile-option--active' : ''}`}
            onClick={() => setLanguage(item.code)}
          >
            <span>{item.label}</span>
            {language === item.code && <Check size={16} color="#CD5E3D" />}
          </button>
        ))}
      </div>
    </section>
  )
}
