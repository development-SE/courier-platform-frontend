import { useState, useEffect } from 'react'
import { auth } from '../../../utils/auth'
import './userModal.css'

export const UserModal = ({
  isOpen,
  mode,
  user,
  companies,
  onSave,
  onCancel,
  loading,
  error,
}) => {
  const session = auth.getSession()
  const callerRole = session?.role || ''
  const isDirector = callerRole === 'DIRECTOR' || callerRole === 'PARTNER'
  const initialFormData = user && (mode === 'edit' || mode === 'view')
    ? {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        companyId: user.companyId || '',
        role: user.role || '',
        password: '',
      }
    : {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        companyId: '',
        role: '',
        password: '',
      }

  const [formData, setFormData] = useState(initialFormData)
  const [errors, setErrors] = useState({})
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const newFormData = user && (mode === 'edit' || mode === 'view')
      ? {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
          companyId: user.companyId || '',
          role: user.role || '',
        }
      : {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          companyId: '',
          role: '',
        }
    if (
      Object.keys(newFormData).some(
        key => formData[key] !== newFormData[key]
      )
    ) {
      setFormData(newFormData)
      setIsEditing(false)
      setErrors({})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isOpen, mode])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

  const validateForm = () => {
    const newErrors = {}

    if (isCreateMode && !formData.password.trim()) {
      newErrors.password = 'Пароль обязателен'
    } else if (isCreateMode && !PASSWORD_REGEX.test(formData.password)) {
      newErrors.password = 'Минимум 8 символов, включая заглавную, строчную, цифру и спецсимвол (@$!%*?&)'
    }

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
    } else if (!/^\+[0-9]{10,14}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Формат: +77085555555 (без пробелов)'
    }

    if (!isDirector && !formData.role) {
      newErrors.role = 'Роль обязательна'
    }

    // For Admin creating with explicit company selection
    if (!isDirector && isCreateMode && (formData.role === 'DIRECTOR' || formData.role === 'MANAGER') && !formData.companyId) {
      newErrors.companyId = 'Компания обязательна для данной роли'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      // Director always creates MANAGER; no companyId needed (backend uses X-Company-Id)
      const payload = isDirector && isCreateMode
        ? { ...formData, role: 'MANAGER', companyId: undefined }
        : isDirector
          ? { ...formData, companyId: undefined }
        : formData
      await onSave(payload)
    } catch {
      // Error handled by parent
    }
  }

  if (!isOpen) return null

  const isViewMode = mode === 'view' && !isEditing
  const isCreateMode = mode === 'create'
  const isCompanyDisabled = isViewMode
  const title = isCreateMode ? 'Добавить пользователя' : 'Пользователь'
  const getRoleLabel = (role) => {
    const normalizedRole = role?.toUpperCase()
    const labels = {
      DIRECTOR: 'Директор',
      MANAGER: 'Менеджер',
      COURIER: 'Курьер',
      USER: 'Пользователь',
    }
    return labels[normalizedRole] || role || ''
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

          <div className="form-row">
            <div className="form-group">
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

            <div className="form-group">
              <label htmlFor="role">Роль</label>
              {isDirector ? (
                /* Director can only create MANAGERs, but view/edit shows the selected user's real role. */
                <input
                  id="role"
                  type="text"
                  value={isCreateMode ? 'Менеджер' : getRoleLabel(formData.role)}
                  disabled
                />
              ) : (
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className={errors.role ? 'input-error' : ''}
                >
                  <option value="">Выберите роль</option>
                  <option value="DIRECTOR">Директор</option>
                  <option value="MANAGER">Менеджер</option>
                </select>
              )}
              {errors.role && <span className="error-text">{errors.role}</span>}
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
                  {isCreateMode && (
          <div className="form-group full-width">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Минимум 8 символов"
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>
        )}

          {/* Director doesn't choose a company — backend uses X-Company-Id from JWT */}
          {!isDirector && (
            <div className="form-group full-width">
              <label htmlFor="companyId">Компания</label>
              <select
                id="companyId"
                name="companyId"
                value={formData.companyId}
                onChange={handleChange}
                disabled={isCompanyDisabled}
                className={errors.companyId ? 'input-error' : ''}
              >
                <option value="">Выберите компанию</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.companyId && <span className="error-text">{errors.companyId}</span>}
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
                {loading ? 'Сохранение...' : isCreateMode ? 'Создать' : 'Сохранить'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
