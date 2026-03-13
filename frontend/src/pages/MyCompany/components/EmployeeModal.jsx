import { useState } from 'react'
import './companyModals.css'

const getInitialFormData = (employee, mode) => {
  if (employee && mode === 'edit') {
    return {
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      email: employee.email || '',
      phone: employee.phone || '',
    }
  }

  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  }
}

export const EmployeeModal = ({
  isOpen,
  mode,
  employee,
  onSave,
  onCancel,
  loading,
  error,
}) => {
  const [formData, setFormData] = useState(() => getInitialFormData(employee, mode))

  if (!isOpen) return null

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await onSave(formData)
  }

  const title = mode === 'edit' ? 'Редактировать сотрудника' : 'Добавить сотрудника'

  return (
    <div className="company-modal-overlay" onClick={onCancel}>
      <div className="company-modal" onClick={event => event.stopPropagation()}>
        <div className="company-modal-header">
          <h2>{title}</h2>
          <button className="company-modal-close" onClick={onCancel} aria-label="Close">
            ×
          </button>
        </div>

        {error && <div className="company-modal-error">{error}</div>}

        <form className="company-modal-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Имя</label>
              <input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Иван"
              />
            </div>
            <div className="form-group">
              <label>Фамилия</label>
              <input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Иванов"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="ivan@example.com"
            />
          </div>
          <div className="form-group">
            <label>Телефон</label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+7 777 777 77 77"
            />
          </div>

          <div className="company-modal-footer">
            <button type="button" className="company-btn-outline" onClick={onCancel} disabled={loading}>
              Отмена
            </button>
            <button type="submit" className="company-btn-primary" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
