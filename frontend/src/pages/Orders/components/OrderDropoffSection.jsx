export const OrderDropoffSection = ({ formData, errors, onChange, onPhoneChange }) => {
  return (
    <div className="order-section">
      <h2>2. Dropoff + Recipient (To)</h2>
      <div className="form-grid">
        <div className="form-field">
          <label>Street *</label>
          <input
            name="dropoffStreet"
            value={formData.dropoffStreet}
            onChange={onChange}
            placeholder="Улица"
            className={errors.dropoffStreet ? 'input-error' : ''}
          />
          {errors.dropoffStreet && <span className="error-text">{errors.dropoffStreet}</span>}
        </div>
        <div className="form-field">
          <label>House *</label>
          <input
            name="dropoffHouse"
            value={formData.dropoffHouse}
            onChange={onChange}
            placeholder="Дом"
            className={errors.dropoffHouse ? 'input-error' : ''}
          />
          {errors.dropoffHouse && <span className="error-text">{errors.dropoffHouse}</span>}
        </div>
        <div className="form-field">
          <label>Apartment</label>
          <input
            name="dropoffApartment"
            value={formData.dropoffApartment}
            onChange={onChange}
            placeholder="Квартира"
          />
        </div>
        <div className="form-field">
          <label>Entrance</label>
          <input
            name="dropoffEntrance"
            value={formData.dropoffEntrance}
            onChange={onChange}
            placeholder="Подъезд"
          />
        </div>
        <div className="form-field">
          <label>Recipient Full Name *</label>
          <input
            name="recipientName"
            value={formData.recipientName}
            onChange={onChange}
            placeholder="Имя Фамилия"
            className={errors.recipientName ? 'input-error' : ''}
          />
          {errors.recipientName && <span className="error-text">{errors.recipientName}</span>}
        </div>
        <div className="form-field">
          <label>Recipient Phone *</label>
          <input
            name="recipientPhone"
            value={formData.recipientPhone}
            onChange={onPhoneChange}
            placeholder="+7 (___) ___-__-__"
            className={errors.recipientPhone ? 'input-error' : ''}
          />
          {errors.recipientPhone && <span className="error-text">{errors.recipientPhone}</span>}
        </div>
      </div>
    </div>
  )
}
