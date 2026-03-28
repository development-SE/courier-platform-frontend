import { useState, useEffect } from 'react'
import './companyModal.css'

export const CompanyModal = ({
  isOpen,
  mode,
  company,
  onSave,
  onCancel,
  loading,
  error,
}) => {
  const initialFormData = company && (mode === 'edit' || mode === 'view')
    ? {
        name: company.name || '',
        bin: company.bin || '',
      }
    : {
        name: '',
        bin: '',
      }

  const [formData, setFormData] = useState(initialFormData)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const newFormData = company && (mode === 'edit' || mode === 'view')
      ? {
          name: company.name || '',
          bin: company.bin || '',
      
        }
      : {
          name: '',
          bin: '',
      
        }
    if (Object.keys(newFormData).some(key => formData[key] !== newFormData[key])) {
      setFormData(newFormData)
      setErrors({})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company, isOpen, mode])

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

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Название компании обязательно'
    }

    if (!formData.bin.trim()) {
      newErrors.bin = 'БИН обязателен'
    } else if (!/^\d{12}$/.test(formData.bin)) {
      newErrors.bin = 'БИН должен быть 12 цифр'
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
  const isCreateMode = mode === 'create'
  const title = isCreateMode ? 'Добавить компанию' : 'Компания'

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="user-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onCancel} aria-label="Close">
            ✕
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-group full-width">
            <label htmlFor="name">Компания</label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isViewMode}
              placeholder='TOO "KFC"'
              className={errors.name ? 'input-error' : ''}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bin">БИН</label>
              <input
                id="bin"
                type="text"
                name="bin"
                value={formData.bin}
                onChange={handleChange}
                disabled={isViewMode}
                placeholder="123456789012"
                className={errors.bin ? 'input-error' : ''}
              />
              {errors.bin && <span className="error-text">{errors.bin}</span>}
            </div>
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
                {loading ? 'Сохранение...' : isCreateMode ? 'Создать' : 'Сохранить'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
