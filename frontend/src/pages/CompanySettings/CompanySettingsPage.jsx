import { useState } from 'react'
import './companySettingsPage.css'

export const CompanySettingsPage = () => {
  const [acceptingOrders, setAcceptingOrders] = useState(true)
  const [workFrom, setWorkFrom] = useState('09:00')
  const [workTo, setWorkTo]   = useState('21:00')
  const [supportPhone, setSupportPhone] = useState('')
  const [pickupAddress, setPickupAddress] = useState('')

  const handleSave = (e) => {
    e.preventDefault()
    // TODO: persist via API
    alert('Настройки сохранены (локально)')
  }

  return (
    <div className="company-settings-page">
      <div className="company-settings-header">
        <h1>Настройки компании</h1>
      </div>

      <form onSubmit={handleSave}>
        <div className="settings-section">
          <p className="settings-section-title">Операционный режим</p>

          <div className="settings-row">
            <label>Принимать заказы</label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={acceptingOrders}
                onChange={e => setAcceptingOrders(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="settings-row">
            <label>Работает с</label>
            <input
              type="time"
              value={workFrom}
              onChange={e => setWorkFrom(e.target.value)}
            />
          </div>

          <div className="settings-row">
            <label>Работает до</label>
            <input
              type="time"
              value={workTo}
              onChange={e => setWorkTo(e.target.value)}
            />
          </div>
        </div>

        <div className="settings-section">
          <p className="settings-section-title">Контакты</p>

          <div className="settings-row">
            <label>Телефон поддержки</label>
            <input
              type="tel"
              value={supportPhone}
              onChange={e => setSupportPhone(e.target.value)}
              placeholder="+77001234567"
            />
          </div>

          <div className="settings-row">
            <label>Адрес забора по умолчанию</label>
            <input
              type="text"
              value={pickupAddress}
              onChange={e => setPickupAddress(e.target.value)}
              placeholder="ул. Абая 1"
            />
          </div>
        </div>

        <button type="submit" className="settings-save-btn">Сохранить</button>
      </form>
    </div>
  )
}
