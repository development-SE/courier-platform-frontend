import { useState } from 'react'

export const OrderPickupSection = ({ formData, errors, pickupOptions, onChange }) => {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredOptions = pickupOptions.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedOption = pickupOptions.find(o => o.value === formData.pickupPoint)
  const displayedOptions = [...filteredOptions]
  if (selectedOption && !displayedOptions.some(o => o.value === selectedOption.value)) {
    displayedOptions.push(selectedOption)
  }

  return (
    <div className="order-section">
      <h2>3. Pickup (From)</h2>
      <div className="form-grid">
        <div className="form-field">
          <label>Pickup Point *</label>
          <div className="pickup-search-container">
            <input
              type="text"
              placeholder="🔍 Поиск адреса..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pickup-search-input"
            />
            <select
              name="pickupPoint"
              value={formData.pickupPoint}
              onChange={onChange}
              className={errors.pickupPoint ? 'input-error' : ''}
            >
              <option value="">Выберите точку забора ({displayedOptions.length})</option>
              {displayedOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
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
