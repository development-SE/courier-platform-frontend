import { useState } from 'react'
import './companyModals.css'

const getInitialFormData = (address, mode) => {
  if (address && mode === 'edit') {
    return {
      street: address.street || '',
      house: address.house || '',
      apartment: address.apartment || '',
      entrance: address.entrance || '',
    }
  }

  return {
    street: '',
    house: '',
    apartment: '',
    entrance: '',
  }
}

export const CompanyAddressModal = ({
  isOpen,
  mode,
  address,
  onSave,
  onCancel,
  loading,
  error,
}) => {
  const [formData, setFormData] = useState(() => getInitialFormData(address, mode))
  const [errors, setErrors] = useState({})

  if (!isOpen) return null

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const validate = () => {
    const nextErrors = {}
    if (!formData.street.trim()) nextErrors.street = 'Улица обязательна'
    if (!formData.house.trim()) nextErrors.house = 'Дом обязателен'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return
    await onSave(formData)
  }

  const title = mode === 'edit' ? 'Редактировать адрес' : 'Добавить адрес'

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
          <div className="form-group">
            <label>Улица</label>
            <input
              name="street"
              value={formData.street}
              onChange={handleChange}
              placeholder="Улы дала"
              className={errors.street ? 'input-error' : ''}
            />
            {errors.street && <span className="error-text">{errors.street}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Дом</label>
              <input
                name="house"
                value={formData.house}
                onChange={handleChange}
                placeholder="41/2"
                className={errors.house ? 'input-error' : ''}
              />
              {errors.house && <span className="error-text">{errors.house}</span>}
            </div>
            <div className="form-group">
              <label>Квартира</label>
              <input
                name="apartment"
                value={formData.apartment}
                onChange={handleChange}
                placeholder="67"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Подъезд</label>
            <input
              name="entrance"
              value={formData.entrance}
              onChange={handleChange}
              placeholder="2"
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
