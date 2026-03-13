export const OrderPickupSection = ({ formData, errors, pickupOptions, onChange }) => {
  return (
    <div className="order-section">
      <h2>3. Pickup (From)</h2>
      <div className="form-grid">
        <div className="form-field">
          <label>Pickup Point *</label>
          <select
            name="pickupPoint"
            value={formData.pickupPoint}
            onChange={onChange}
            className={errors.pickupPoint ? 'input-error' : ''}
          >
            <option value="">Выберите точку забора</option>
            {pickupOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {errors.pickupPoint && <span className="error-text">{errors.pickupPoint}</span>}
        </div>
        <div className="form-field">
          <label>Pickup Contact Person</label>
          <input
            name="pickupContact"
            value={formData.pickupContact}
            onChange={onChange}
            placeholder="Контактное лицо"
          />
        </div>
      </div>
    </div>
  )
}
