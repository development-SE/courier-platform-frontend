import { NavLink } from 'react-router-dom'
import { LayoutGrid, CalendarDays, Wallet, MessageSquare, UserCircle2 } from 'lucide-react'
import { getMessagesSnapshot } from '../../services/courierDataService'
import { countUnreadMessages } from '../../domain/messages/model'
import { ROUTES } from '../../constants/routes'
import './BottomNav.css'

const TABS = [
  { to: ROUTES.DASHBOARD, label: 'Заказы', Icon: LayoutGrid, end: true },
  { to: ROUTES.SLOTS, label: 'Слоты', Icon: CalendarDays },
  { to: ROUTES.MONEY, label: 'Деньги', Icon: Wallet },
  { to: ROUTES.MESSAGES, label: 'Сообщения', Icon: MessageSquare },
  { to: ROUTES.PROFILE, label: 'Профиль', Icon: UserCircle2 },
]

export default function BottomNav() {
  const unreadCount = countUnreadMessages(getMessagesSnapshot())

  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `bottom-nav__tab${isActive ? ' bottom-nav__tab--active' : ''}`}
        >
          <span className="bottom-nav__icon-wrap">
            <Icon size={20} strokeWidth={1.8} />
            {to === ROUTES.MESSAGES && unreadCount > 0 && <span className="bottom-nav__badge">{unreadCount}</span>}
          </span>
          <span className="bottom-nav__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
