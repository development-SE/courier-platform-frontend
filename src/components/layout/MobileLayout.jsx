import { Outlet, useLocation } from 'react-router-dom'
import { FULL_SCREEN_ROUTES } from '../../constants/routes'
import BottomNav from './BottomNav'
import './MobileLayout.css'

export default function MobileLayout({ children }) {
  const { pathname } = useLocation()
  const isFullScreen = FULL_SCREEN_ROUTES.includes(pathname)

  return (
    <div className="mobile-shell">
      <main className={`mobile-shell__content${isFullScreen ? ' mobile-shell__content--map' : ''}`}>
        {children ?? <Outlet />}
      </main>
      <BottomNav />
    </div>
  )
}
