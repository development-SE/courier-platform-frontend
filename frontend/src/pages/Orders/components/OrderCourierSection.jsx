import { DELIVERY_TYPES } from '../orderFormUtils'

export const OrderCourierSection = ({ formData, errors, courierOptions, onChange }) => {
  return (
    <div className="order-section">
      <h2>4. Courier Assignment</h2>
      <div className="form-grid">
        <div className="form-field">
          <label>Courier *</label>
          <select
            name="courierId"
            value={formData.courierId}
            onChange={onChange}
            className={errors.courierId ? 'input-error' : ''}
          >
            <option value="">Выберите курьера</option>
            {courierOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {errors.courierId && <span className="error-text">{errors.courierId}</span>}
        </div>
        <div className="form-field">
          <label>Type of delivery *</label>
          <select
            name="deliveryType"
            value={formData.deliveryType}
            onChange={onChange}
            className={errors.deliveryType ? 'input-error' : ''}
          >
            <option value="">Выберите тип</option>
            {DELIVERY_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {errors.deliveryType && <span className="error-text">{errors.deliveryType}</span>}
        </div>
        <div className="form-field">
          <label>Planned Pickup Time</label>
          <input
            name="plannedPickupTime"
            value={formData.plannedPickupTime}
            onChange={onChange}
            placeholder="MM/DD/YYYY HH:mm"
            className={errors.plannedPickupTime ? 'input-error' : ''}
          />
          {errors.plannedPickupTime && (
            <span className="error-text">{errors.plannedPickupTime}</span>
          )}
        </div>
      </div>
    </div>
  )
}
