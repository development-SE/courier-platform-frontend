import { Link } from 'react-router-dom'
import Hero from '../../assets/Hero.png'
import restaurantIcon from '../../assets/categories/Restaurant.png'
import groceriesIcon from '../../assets/categories/Groceries.png'
import pharmacyIcon from '../../assets/categories/pharmacy.png'
import clothesIcon from '../../assets/categories/Clothes.png'
import homeIcon from '../../assets/categories/Forhome.png'
import giftsIcon from '../../assets/categories/Gifts.png'
import fastIcon from '../../assets/advatages/Fastdeliv.png'
import qualityIcon from '../../assets/advatages/Guarantee.png'
import supportIcon from '../../assets/advatages/Support.png'
import './userHomePage.css'

const categories = [
  { id: 'cat-1', name: 'Рестораны', icon: restaurantIcon, tone: 'food' },
  { id: 'cat-2', name: 'Продукты', icon: groceriesIcon, tone: 'groceries' },
  { id: 'cat-3', name: 'Аптеки', icon: pharmacyIcon, tone: 'pharmacy' },
  { id: 'cat-4', name: 'Одежда', icon: clothesIcon, tone: 'clothes' },
  { id: 'cat-5', name: 'Для дома', icon: homeIcon, tone: 'home' },
  { id: 'cat-6', name: 'Подарки', icon: giftsIcon, tone: 'gifts' },
]

const popularStores = [
  { id: 'store-1', name: 'Вкусно & Точка', eta: '25-35 мин', fee: 'От 200₽', rating: '4.8', tags: ['Бургеры', 'Фастфуд'] },
  { id: 'store-2', name: 'Перекрёсток', eta: '30-40 мин', fee: 'Бесплатно', rating: '4.9', tags: ['Продукты', 'Супермаркет'] },
  { id: 'store-3', name: 'Аптека 36.6', eta: '20-30 мин', fee: 'От 150₽', rating: '5.0', tags: ['Лекарства', 'Здоровье'] },
  { id: 'store-4', name: 'Суши Wok', eta: '35-45 мин', fee: 'От 300₽', rating: '4.7', tags: ['Суши', 'Азиатская кухня'] },
]

const nearbyStores = [
  { id: 'near-1', name: 'Пекарня у дома', eta: '15-20 мин', fee: 'Бесплатно' },
  { id: 'near-2', name: 'Кофе Хауз', eta: '10-15 мин', fee: 'Бесплатно' },
  { id: 'near-3', name: 'Цветочная Лавка', eta: '20-25 мин', fee: 'От 100₽' },
  { id: 'near-4', name: 'Зоомагазин', eta: '25-30 мин', fee: 'От 200₽' },
]

const advantages = [
  { id: 'adv-1', title: 'Быстрая доставка', text: 'Доставим ваш заказ в среднем за 30 минут', icon: fastIcon },
  { id: 'adv-2', title: 'Гарантия качества', text: 'Проверяем каждый заказ перед отправкой', icon: qualityIcon },
  { id: 'adv-3', title: 'Поддержка 24/7', text: 'Всегда на связи, чтобы помочь вам', icon: supportIcon },
]

export const UserHomePage = () => {
  return (
    <div className="user-home">
      <header className="user-home__header">
        <div className="user-home__header-inner">
          <div className="user-home__desktop-topbar-content">
            <div className="user-home__logo-wrap">
              <span className="user-home__logo-mark">S</span>
              <span className="user-home__logo-text">SwiftDeliver</span>
            </div>

            <button type="button" className="user-home__address-btn">📍 ул. Пушкина, д. 10</button>

            <div className="user-home__search-wrap">
              <span className="user-home__search-icon">🔍</span>
              <input type="text" placeholder="Поиск магазинов, товаров..." />
            </div>

            <button type="button" className="user-home__cart-btn" aria-label="Корзина">
              🛒
              <span className="user-home__cart-badge">3</span>
            </button>

            <Link to="/sign-in" className="user-home__login-btn">Войти</Link>
          </div>

          <div className="user-home__mobile-topbar-content">
            <div className="user-home__mobile-top-row">
              <button type="button" className="user-home__mobile-avatar" aria-label="Профиль">
                👤
              </button>
              <button type="button" className="user-home__mobile-address" aria-label="Адрес">
                <span>Uly Dala 41/2, entrance 2</span>
                <strong>ASAP</strong>
              </button>
              <Link to="/sign-in" className="user-home__mobile-login-btn">Войти</Link>
            </div>
            <div className="user-home__mobile-search-row">
              <div className="user-home__search-wrap">
                <input type="text" placeholder="Поиск" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="user-home__hero">
          <div className="user-home__container user-home__hero-grid">
            <div className="user-home__hero-content">
              <h1>
                Доставим все, что
                <br />
                нужно как можно
                <br />
                <span>быстрее</span>
              </h1>
              <p>
                Продукты, готовая еда, товары для дома
                <br />
                и многое другое
                <br />
                от лучших магазинов вашего города.
              </p>
              <div className="user-home__hero-actions">
                <button type="button" className="primary-btn">Заказать доставку</button>
                <button type="button" className="ghost-btn">Как это работает</button>
              </div>
            </div>
            <div className="user-home__hero-image-wrap">
              <img src={Hero} alt="Курьер" className="user-home__hero-image" />
            </div>
          </div>
        </section>

        <section className="user-home__section user-home__section--soft user-home__section--categories">
          <div className="user-home__container">
            <h2>Категории</h2>
            <div className="user-home__categories-grid">
              {categories.map(category => (
                <button key={category.id} type="button" className="category-card">
                  <span className={`category-card__icon category-card__icon--${category.tone}`}>
                    <img src={category.icon} alt={category.name} />
                  </span>
                  <span className="category-card__name">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="user-home__section user-home__section--white">
          <div className="user-home__container">
            <div className="section-head">
              <h2>Популярные магазины</h2>
              <button type="button" className="section-link">Все магазины →</button>
            </div>

            <div className="stores-grid">
              {popularStores.map(store => (
                <article key={store.id} className="store-card">
                  <div className="store-card__cover">
                    <span className="store-card__open">Открыто</span>
                    <span className="store-card__rating">⭐ {store.rating}</span>
                  </div>
                  <div className="store-card__body">
                    <h3>{store.name}</h3>
                    <div className="store-card__meta-row">
                      <span>🕒 {store.eta}</span>
                      <span>🛵 {store.fee}</span>
                    </div>
                    <div className="store-card__tags">
                      {store.tags.map(tag => (
                        <span key={`${store.id}-${tag}`}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="user-home__section user-home__section--soft">
          <div className="user-home__container">
            <div className="section-head">
              <h2>Быстрая доставка рядом</h2>
              <button type="button" className="section-link">Смотреть все →</button>
            </div>

            <div className="stores-grid">
              {nearbyStores.map(store => (
                <article key={store.id} className="store-card">
                  <div className="store-card__cover store-card__cover--alt" />
                  <div className="store-card__body">
                    <h3>{store.name}</h3>
                    <div className="store-card__meta-row">
                      <span>🕒 {store.eta}</span>
                      <span>{store.fee}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="user-home__section user-home__section--accent">
          <div className="user-home__container">
            <div className="section-head section-head--centered">
              <h2>Почему выбирают нас</h2>
              <p>Мы делаем доставку быстрой, удобной и надёжной</p>
            </div>

            <div className="advantages-grid">
              {advantages.map(item => (
                <article key={item.id} className="advantage-card">
                  <span className="advantage-card__icon">
                    <img src={item.icon} alt={item.title} />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="user-home__footer">
        <div className="user-home__container user-home__footer-top">
          <div className="footer-brand">
            <div className="user-home__logo-wrap user-home__logo-wrap--footer">
              <span className="user-home__logo-mark">S</span>
              <span className="user-home__logo-text">SwiftDeliver</span>
            </div>
            <p>Быстрая доставка всего, что вам нужно</p>
          </div>

          <div className="footer-col">
            <h4>Компания</h4>
            <a href="#">О нас</a>
            <a href="#">Вакансии</a>
            <a href="#">Партнёрам</a>
            <a href="#">Курьерам</a>
          </div>

          <div className="footer-col">
            <h4>Помощь</h4>
            <a href="#">FAQ</a>
            <a href="#">Поддержка</a>
            <a href="#">Доставка и оплата</a>
            <a href="#">Возврат</a>
          </div>

          <div className="footer-col">
            <h4>Контакты</h4>
            <a href="tel:+78005553535">8 800 555-35-35</a>
            <a href="mailto:info@swiftdeliver.ru">info@swiftdeliver.ru</a>
            <span>Москва, Россия</span>
          </div>
        </div>

        <div className="user-home__container user-home__footer-bottom">
          <span>© 2024 SwiftDeliver. Все права защищены</span>
          <div className="footer-bottom-links">
            <a href="#">Политика конфиденциальности</a>
            <a href="#">Условия использования</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
