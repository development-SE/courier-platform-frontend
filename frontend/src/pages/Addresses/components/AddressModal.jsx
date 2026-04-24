import { useState, useEffect } from 'react'
import { auth } from '../../../utils/auth'
import './addressModal.css'

export const AddressModal = ({
  isOpen,
  mode,
  address,
  companies,
  users,
  onSave,
  onCancel,
  loading,
  error,
}) => {
  const session = auth.getSession()
  const callerRole = session?.role || ''
  const isCompanyScoped = callerRole === 'DIRECTOR' || callerRole === 'PARTNER' || callerRole === 'MANAGER'
  const initialFormData = address && (mode === 'edit' || mode === 'view')
    ? {
        type: address.type || 'company',
        ownerId: address.companyId || address.ownerId || '',
        street: address.street || '',
        house: address.house || '',
        apartment: address.apartment || '',
        entrance: address.entrance || '',
      }
    : {
        type: 'company',
        ownerId: '',
        street: '',
        house: '',
        apartment: '',
        entrance: '',
      }

  const [formData, setFormData] = useState(initialFormData)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const newFormData = address && (mode === 'edit' || mode === 'view')
      ? {
          type: address.type || 'company',
          ownerId: address.companyId || address.ownerId || '',
          street: address.street || '',
          house: address.house || '',
          apartment: address.apartment || '',
          entrance: address.entrance || '',
        }
      : {
          type: 'company',
          ownerId: '',
          street: '',
          house: '',
          apartment: '',
          entrance: '',
        }
    if (Object.keys(newFormData).some(key => formData[key] !== newFormData[key])) {
      setFormData(newFormData)
      setErrors({})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isOpen, mode])

  const handleChange = (e) => {
    const { name, value } = e.target
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

  const handleTypeChange = (nextType) => {
    setFormData(prev => ({
      ...prev,
      type: nextType,
      ownerId: '',
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!isCompanyScoped && !formData.ownerId) newErrors.ownerId = 'Выберите владельца'
    if (!formData.street.trim()) newErrors.street = 'Улица обязательна'
    if (!formData.house.trim()) newErrors.house = 'Дом обязателен'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    try {
      const payload = isCompanyScoped
        ? { ...formData, type: 'company', ownerId: undefined }
        : formData
      await onSave(payload)
    } catch {
      // Error handled by parent
    }
  }

  if (!isOpen) return null

  const isViewMode = mode === 'view'
  const isCreateMode = mode === 'create'
  const title = isCreateMode ? 'Добавить/редактировать' : 'Адрес'

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="address-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onCancel} aria-label="Close">
            ×
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        {!isCompanyScoped && (
        <div className="address-tabs">
          <button
            type="button"
            className={`tab-btn ${formData.type === 'company' ? 'active' : ''}`}
            onClick={() => handleTypeChange('company')}
            disabled={isViewMode}
          >
            Компания
          </button>
          <button
            type="button"
            className={`tab-btn ${formData.type === 'user' ? 'active' : ''}`}
            onClick={() => handleTypeChange('user')}
            disabled={isViewMode}
          >
            Пользователь
          </button>
        </div>
        )}

        <form onSubmit={handleSubmit} className="address-form">
          {!isCompanyScoped && (
          <div className="form-group full-width">
            <label htmlFor="ownerId">{formData.type === 'company' ? 'Компания' : 'Пользователь'}</label>
            <select
              id="ownerId"
              name="ownerId"
              value={formData.ownerId}
              onChange={handleChange}
              disabled={isViewMode}
              className={errors.ownerId ? 'input-error' : ''}
            >
              <option value="">Выберите</option>
              {formData.type === 'company'
                ? companies.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} — BIN {c.bin}
                    </option>
                  ))
                : users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </option>
                  ))
              }
            </select>
            {errors.ownerId && <span className="error-text">{errors.ownerId}</span>}
          </div>
          )}

          <div className="form-group full-width">
            <label htmlFor="street">Улица</label>
            <input
              id="street"
              type="text"
              name="street"
              value={formData.street}
              onChange={handleChange}
              disabled={isViewMode}
              placeholder="Улы дала"
              className={errors.street ? 'input-error' : ''}
            />
            {errors.street && <span className="error-text">{errors.street}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="house">Дом</label>
              <input
                id="house"
                type="text"
                name="house"
                value={formData.house}
                onChange={handleChange}
                disabled={isViewMode}
                placeholder="41/2"
                className={errors.house ? 'input-error' : ''}
              />
              {errors.house && <span className="error-text">{errors.house}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="apartment">Квартира</label>
              <input
                id="apartment"
                type="text"
                name="apartment"
                value={formData.apartment}
                onChange={handleChange}
                disabled={isViewMode}
                placeholder="67"
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="entrance">Подъезд</label>
            <input
              id="entrance"
              type="text"
              name="entrance"
              value={formData.entrance}
              onChange={handleChange}
              disabled={isViewMode}
              placeholder="2"
            />
          </div>

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

