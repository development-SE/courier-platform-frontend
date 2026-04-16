import { useState } from 'react'
import './catalogPage.css'

export const CatalogPage = () => {
  const [storeOpen, setStoreOpen] = useState(true)

  return (
    <div className="catalog-page">
      <div className="catalog-header">
        <h1>Каталог</h1>
      </div>

      <div className="catalog-availability">
        <span className="catalog-availability-label">Магазин:</span>
        <span className={`availability-badge ${storeOpen ? 'open' : 'closed'}`}>
          {storeOpen ? 'Открыт' : 'Закрыт'}
        </span>
        <label className="toggle" style={{ marginLeft: 'auto' }}>
          <input
            type="checkbox"
            checked={storeOpen}
            onChange={e => setStoreOpen(e.target.checked)}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      <div className="catalog-placeholder">
        Здесь будут категории и товары каталога.
        <p>Интеграция с product-service запланирована.</p>
      </div>
    </div>
  )
}
