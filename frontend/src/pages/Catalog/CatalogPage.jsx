import { useState, useEffect } from 'react'
import './catalogPage.css'

// ── Seed / Default Data ──────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  '🍔 Бургеры',
  '🍕 Пицца',
  '🥤 Напитки',
  '🍰 Десерты'
]

const DEFAULT_PRODUCTS = [
  {
    id: '1',
    category: '🍔 Бургеры',
    name: 'Чизбургер Классический',
    price: 1200,
    desc: 'Сочная говяжья котлета, плавленый чеддер, маринованные огурцы, красный лук, фирменный соус.',
    inStock: true,
    emoji: '🍔'
  },
  {
    id: '2',
    category: '🍔 Бургеры',
    name: 'Дабл Бекон Бургер',
    price: 1850,
    desc: 'Две мясных котлеты гриль, хрустящий бекон, двойной сыр чеддер, томаты, салат айсберг, соус BBQ.',
    inStock: true,
    emoji: '🥓'
  },
  {
    id: '3',
    category: '🍕 Пицца',
    name: 'Пицца Маргарита',
    price: 2400,
    desc: 'Классическая пицца с насыщенным томатным соусом, моцареллой и свежими листиками базилика.',
    inStock: true,
    emoji: '🍕'
  },
  {
    id: '4',
    category: '🍕 Пицца',
    name: 'Пицца Пепперони',
    price: 2900,
    desc: 'Пикантные слайсы пепперони, сыр моцарелла, итальянские травы, томатная основа.',
    inStock: true,
    emoji: '🌶️'
  },
  {
    id: '5',
    category: '🥤 Напитки',
    name: 'Кока-Кола 0.5л',
    price: 450,
    desc: 'Освежающий прохладный газированный напиток.',
    inStock: true,
    emoji: '🥤'
  },
  {
    id: '6',
    category: '🥤 Напитки',
    name: 'Лимонад Домашний',
    price: 650,
    desc: 'Натуральный лимонад на основе лимонного сока, свежей мяты и газированной воды.',
    inStock: true,
    emoji: '🍋'
  },
  {
    id: '7',
    category: '🍰 Десерты',
    name: 'Чизкейк Нью-Йорк',
    price: 1500,
    desc: 'Классический нежный сливочный чизкейк на песочном корже с клубничным топпингом.',
    inStock: true,
    emoji: '🍰'
  },
  {
    id: '8',
    category: '🍰 Десерты',
    name: 'Шоколадный Брауни',
    price: 1300,
    desc: 'Насыщенный шоколадный пирог с грецким орехом.',
    inStock: false,
    emoji: '🍫'
  }
]

// Emoji mapping helper based on category
const getEmojiForCategory = (catName) => {
  if (catName.includes('Бург')) return '🍔'
  if (catName.includes('Пиц')) return '🍕'
  if (catName.includes('Нап')) return '🥤'
  if (catName.includes('Дес')) return '🍰'
  return '📦'
}

export const CatalogPage = () => {
  // Store status
  const [storeOpen, setStoreOpen] = useState(() => {
    const saved = localStorage.getItem('catalog_store_open')
    return saved !== null ? JSON.parse(saved) : true
  })

  // Categories list
  const [categories] = useState(DEFAULT_CATEGORIES)
  const [activeCategory, setActiveCategory] = useState(DEFAULT_CATEGORIES[0])

  // Products list
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('catalog_products')
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS
  })

  // Modal and edit state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: DEFAULT_CATEGORIES[0],
    desc: '',
    inStock: true
  })

  // Save states to local storage
  useEffect(() => {
    localStorage.setItem('catalog_products', JSON.stringify(products))
  }, [products])

  useEffect(() => {
    localStorage.setItem('catalog_store_open', JSON.stringify(storeOpen))
  }, [storeOpen])

  // Toggle store status
  const handleToggleStore = () => {
    setStoreOpen(prev => !prev)
  }

  // Toggle single product stock status
  const handleToggleStock = (id) => {
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, inStock: !p.inStock } : p
    ))
  }

  // Open modal for add
  const handleOpenAddModal = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      price: '',
      category: activeCategory,
      desc: '',
      inStock: true
    })
    setIsModalOpen(true)
  }

  // Open modal for edit
  const handleOpenEditModal = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      price: String(product.price),
      category: product.category,
      desc: product.desc || '',
      inStock: product.inStock
    })
    setIsModalOpen(true)
  }

  // Delete product
  const handleDeleteProduct = (id) => {
    if (window.confirm('Вы действительно хотите удалить этот товар?')) {
      setProducts(prev => prev.filter(p => p.id !== id))
    }
  }

  // Handle form change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.price.trim()) {
      alert('Пожалуйста, заполните название и цену!')
      return
    }

    const priceNum = parseFloat(formData.price)
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Пожалуйста, введите корректную цену!')
      return
    }

    if (editingProduct) {
      // Update
      setProducts(prev => prev.map(p =>
        p.id === editingProduct.id
          ? {
              ...p,
              name: formData.name.trim(),
              price: priceNum,
              category: formData.category,
              desc: formData.desc.trim(),
              inStock: formData.inStock,
              emoji: getEmojiForCategory(formData.category)
            }
          : p
      ))
    } else {
      // Create
      const newProduct = {
        id: String(Date.now()),
        name: formData.name.trim(),
        price: priceNum,
        category: formData.category,
        desc: formData.desc.trim(),
        inStock: formData.inStock,
        emoji: getEmojiForCategory(formData.category)
      }
      setProducts(prev => [...prev, newProduct])
      // Automatically switch to the category we just added to
      setActiveCategory(formData.category)
    }

    setIsModalOpen(false)
  }

  // Filter products by category
  const filteredProducts = products.filter(p => p.category === activeCategory)

  // Get count for each category
  const getCategoryCount = (cat) => {
    return products.filter(p => p.category === cat).length
  }

  return (
    <div className="catalog-page">
      {/* Catalog Header */}
      <div className="catalog-header">
        <h1>Каталог</h1>
        <button type="button" className="catalog-add-btn" onClick={handleOpenAddModal}>
          <span>+</span> Добавить товар
        </button>
      </div>

      {/* Store Availability Toggle */}
      <div className="catalog-availability">
        <span className="catalog-availability-label">Статус магазина:</span>
        <span className={`availability-badge ${storeOpen ? 'open' : 'closed'}`}>
          {storeOpen ? 'Открыт' : 'Закрыт'}
        </span>
        <label className="toggle" style={{ marginLeft: 'auto' }}>
          <input
            type="checkbox"
            checked={storeOpen}
            onChange={handleToggleStore}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      {/* Main Catalog Layout */}
      <div className="catalog-layout">
        {/* Sidebar Categories */}
        <div className="categories-sidebar">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
              <span className="category-count">{getCategoryCount(cat)}</span>
            </button>
          ))}
        </div>

        {/* Products List/Grid */}
        <div className="products-container">
          {filteredProducts.length === 0 ? (
            <div className="empty-products">
              В этой категории пока нет товаров. Нажмите «Добавить товар», чтобы наполнить её!
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className={`product-card ${product.inStock ? '' : 'out-of-stock'}`}
                >
                  {/* Visual Image / Placeholder */}
                  <div className="product-image-placeholder">
                    {product.emoji || '📦'}
                    {!product.inStock && (
                      <span className="product-badge-oos">Нет в наличии</span>
                    )}
                  </div>

                  {/* Info details */}
                  <div className="product-info">
                    <h3 className="product-title">{product.name}</h3>
                    <p className="product-desc" title={product.desc}>
                      {product.desc || 'Описание отсутствует.'}
                    </p>

                    <div className="product-footer">
                      <span className="product-price">{product.price.toLocaleString()} ₸</span>
                      
                      <div className="product-actions">
                        {/* Toggle stock availability */}
                        <button
                          type="button"
                          className={`action-btn toggle-stock ${product.inStock ? 'active' : 'inactive'}`}
                          title={product.inStock ? 'Сделать "Нет в наличии"' : 'Сделать "В наличии"'}
                          onClick={() => handleToggleStock(product.id)}
                        >
                          {product.inStock ? 'В наличии' : 'Нет на складе'}
                        </button>
                        
                        {/* Edit */}
                        <button
                          type="button"
                          className="action-btn"
                          title="Редактировать"
                          onClick={() => handleOpenEditModal(product)}
                        >
                          ✏️
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          className="action-btn delete"
                          title="Удалить"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Product Modal Dialog */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingProduct ? 'Редактировать товар' : 'Добавить новый товар'}</h3>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Product Name */}
                <div className="form-group">
                  <label htmlFor="p-name">Название товара *</label>
                  <input
                    id="p-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Например: Двойной чизбургер"
                    required
                  />
                </div>

                <div className="form-row-2">
                  {/* Product Price */}
                  <div className="form-group">
                    <label htmlFor="p-price">Цена (₸) *</label>
                    <input
                      id="p-price"
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="Цена"
                      required
                    />
                  </div>

                  {/* Product Category */}
                  <div className="form-group">
                    <label htmlFor="p-category">Категория</label>
                    <select
                      id="p-category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Product Description */}
                <div className="form-group">
                  <label htmlFor="p-desc">Описание товара</label>
                  <textarea
                    id="p-desc"
                    name="desc"
                    value={formData.desc}
                    onChange={handleInputChange}
                    placeholder="Введите описание ингредиентов или параметров..."
                    rows={3}
                  />
                </div>

                {/* Availability Checkbox */}
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                  <input
                    id="p-instock"
                    type="checkbox"
                    name="inStock"
                    checked={formData.inStock}
                    onChange={handleInputChange}
                    style={{ width: 'auto', margin: 0 }}
                  />
                  <label htmlFor="p-instock" style={{ margin: 0, cursor: 'pointer' }}>В наличии на складе</label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Отмена
                </button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Сохранить изменения' : 'Создать товар'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
