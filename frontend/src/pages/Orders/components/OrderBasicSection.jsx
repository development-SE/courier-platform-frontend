import { SERVICE_TYPES } from '../orderFormUtils'

export const OrderBasicSection = ({ formData, errors, onChange }) => {
  return (
    <div className="order-section">
      <h2>1. Basic Information</h2>
      <div className="form-grid">
        <div className="form-field">
          <label>Service Type *</label>
          <select
            name="serviceType"
            value={formData.serviceType}
            onChange={onChange}
            className={errors.serviceType ? 'input-error' : ''}
          >
            <option value="">Выберите сервис</option>
            {SERVICE_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          {errors.serviceType && <span className="error-text">{errors.serviceType}</span>}
        </div>
        <div className="form-field full-width">
          <label>Comments / Notes</label>
          <textarea
            name="comments"
            value={formData.comments}
            onChange={onChange}
            rows={3}
            placeholder="Комментарий к заказу"
          />
        </div>
      </div>
    </div>
  )
}
