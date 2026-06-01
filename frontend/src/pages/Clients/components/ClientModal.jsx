import { useState, useEffect } from 'react'
import '../../Users/components/userModal.css'

export const ClientModal = ({
  isOpen,
  mode,
  client,
  onSave,
  onCancel,
  loading,
  error,
}) => {
  const initialFormData = client && (mode === 'edit' || mode === 'view')
    ? {
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        email: client.email || '',
        phone: client.phone || '',
      }
    : {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
      }

  const [formData, setFormData] = useState(initialFormData)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const newFormData = client && (mode === 'edit' || mode === 'view')
      ? {
          firstName: client.firstName || '',
          lastName: client.lastName || '',
          email: client.email || '',
          phone: client.phone || '',
        }
      : {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
        }
    setFormData(newFormData)
    setErrors({})
  }, [client, isOpen, mode])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Имя обязательно'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Фамилия обязательна'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Неверный формат email'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Телефон обязателен'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      await onSave(formData)
    } catch {
      // Error handled by parent
    }
  }

  if (!isOpen) return null

  const isViewMode = mode === 'view'
  const title = isViewMode ? 'Клиент' : 'Редактировать клиента'

  const formatDate = (value) => {
    if (!value) return '—'
    const ts = typeof value === 'number' ? value * 1000 : value
    const date = new Date(ts)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="user-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onCancel} aria-label="Close">
            ×
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">Имя</label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                disabled={isViewMode}
                placeholder="Имя"
                className={errors.firstName ? 'input-error' : ''}
              />
              {errors.firstName && (
                <span className="error-text">{errors.firstName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Фамилия</label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                disabled={isViewMode}
                placeholder="Фамилия"
                className={errors.lastName ? 'input-error' : ''}
              />
              {errors.lastName && (
                <span className="error-text">{errors.lastName}</span>
              )}
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isViewMode}
              placeholder="email@example.com"
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group full-width">
            <label htmlFor="phone">Телефон</label>
            <input
              id="phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={isViewMode}
              placeholder="+7 708 555 55 55"
              className={errors.phone ? 'input-error' : ''}
            />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>

          {isViewMode && client && (
            <div className="form-row">
              <div className="form-group">
                <label>Роль</label>
                <input type="text" value="Клиент" disabled />
              </div>
              <div className="form-group">
                <label>Дата регистрации</label>
                <input type="text" value={formatDate(client.createdAt)} disabled />
              </div>
            </div>
          )}

          {!isViewMode && (
            <div className="modal-footer">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="btn-cancel"
              >
                Отмена
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
