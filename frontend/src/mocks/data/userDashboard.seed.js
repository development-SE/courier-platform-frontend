export const userActiveOrdersSeed = [
  {
    id: 'ord-1',
    orderNumber: '#12847',
    title: 'Магазин "Продукты 24"',
    address: 'ул. Ленина, 45, к. 12',
    eta: '15-20 мин',
    status: 'В пути',
    courier: 'Иван М',
    total: '1 890 ₽',
    cta: 'Отследить заказ',
  },
  {
    id: 'ord-2',
    orderNumber: '#12846',
    title: 'Аптека "Здоровье+"',
    address: 'ул. Ленина, 45, к. 12',
    eta: '30-35 мин',
    status: 'Готовится',
    courier: '',
    total: '1 240 ₽',
    cta: 'Отследить заказ',
  },
  {
    id: 'ord-3',
    orderNumber: '#12845',
    title: 'Магазин "Электроника"',
    address: 'ул. Ленина, 45, к. 12',
    eta: 'в 14:30',
    status: 'Доставлен',
    courier: '',
    total: '3 890 ₽',
    cta: 'Оставить отзыв',
  },
]

export const userCategoriesSeed = [
  { id: 'c1', name: 'Еда', active: true },
  { id: 'c2', name: 'Продукты' },
  { id: 'c3', name: 'Аптека' },
  { id: 'c4', name: 'Подарки' },
  { id: 'c5', name: 'Электроника' },
  { id: 'c6', name: 'Одежда' },
  { id: 'c7', name: 'Книги' },
]

export const userPopularStoresSeed = [
  { id: 's1', name: 'Продукты 24', info: 'Продукты • Минимум 500 ₽', eta: '20-30 мин', price: '99 ₽', rating: '4.8' },
  { id: 's2', name: 'Аптека Здоровье+', info: 'Аптека • Минимум 300 ₽', eta: '15-25 мин', price: 'Бесплатно', rating: '4.9' },
  { id: 's3', name: 'ЭлектроМир', info: 'Электроника • Минимум 1000 ₽', eta: '30-40 мин', price: '149 ₽', rating: '4.7' },
  { id: 's4', name: 'Книжный Мир', info: 'Книги • Минимум 700 ₽', eta: '25-35 мин', price: '120 ₽', rating: '5.0' },
]

export const userNearbyStoresSeed = [
  { id: 'n1', name: 'Супермаркет Пятёрочка', distance: '0.5 км от вас', eta: '10 мин' },
  { id: 'n2', name: 'Аптека 36.6', distance: '0.7 км от вас', eta: '12 мин' },
  { id: 'n3', name: 'М.Видео', distance: '1.2 км от вас', eta: '15 мин' },
  { id: 'n4', name: 'Кофейня Старбакс', distance: '0.3 км от вас', eta: '8 мин' },
]
