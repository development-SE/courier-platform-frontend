import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../utils/auth'
import { storage } from '../utils/storage'
import './partnerLayout.css'

export const PartnerLayout = ({ children, currentPage }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [topbarName, setTopbarName] = useState('')
  const profileMenuRef = useRef(null)
  const navigate = useNavigate()

  const session = auth.getSession()
  const role = session?.role || 'PARTNER'
  const isAdmin = role === 'ADMIN'
  const isActive = (page) => currentPage === page

  const resolvedName = useMemo(() => {
    if (isAdmin) return 'Admin'
    return topbarName || session?.name || 'Partner'
  }, [isAdmin, session?.name, topbarName])

  const handleLogout = () => {
    auth.signOut()
    navigate('/sign-in', { replace: true })
  }

  useEffect(() => {
    if (isAdmin) {
      return undefined
    }

    const syncTopbarName = () => {
      const users = storage.getUsers()
      const director = users.find(user => user.role === 'Director')
      const directorName = director
        ? `${director.firstName || ''} ${director.lastName || ''}`.trim()
        : ''

      setTopbarName(directorName || session?.name || 'Partner')
    }

    syncTopbarName()
    window.addEventListener('users-updated', syncTopbarName)
    window.addEventListener('storage', syncTopbarName)

    return () => {
      window.removeEventListener('users-updated', syncTopbarName)
      window.removeEventListener('storage', syncTopbarName)
    }
  }, [isAdmin, session?.name])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={`partner-layout ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <aside className="sidebar">
        <nav className="sidebar-nav">
          <Link
            to="/"
            className={`nav-link ${isActive('home') ? 'active' : ''}`}
          >
            <span className="nav-icon">
              <img src="/src/assets/Home.png" alt="" />
            </span>
            <span className="nav-text">Home</span>
          </Link>

          <Link
            to="/orders"
            className={`nav-link ${isActive('orders') ? 'active' : ''}`}
          >
            <span className="nav-icon">
              <img src="/src/assets/order.png" alt="" />
            </span>
            <span className="nav-text">Заказы</span>
          </Link>

          {isAdmin && (
            <Link
              to="/companies"
              className={`nav-link ${isActive('companies') ? 'active' : ''}`}
            >
              <span className="nav-icon">
                <img src="/src/assets/Companies.png" alt="" />
              </span>
              <span className="nav-text">Companies</span>
            </Link>
          )}

          <Link
            to="/users"
            className={`nav-link ${isActive('users') ? 'active' : ''}`}
          >
            <span className="nav-icon">
              <img src="/src/assets/Users.png" alt="" />
            </span>
            <span className="nav-text">{isAdmin ? 'Users' : 'Сотрудники'}</span>
          </Link>

          <Link
            to="/addresses"
            className={`nav-link ${isActive('addresses') ? 'active' : ''}`}
          >
            <span className="nav-icon">
              <img src="/src/assets/Address.png" alt="" />
            </span>
            <span className="nav-text">{isAdmin ? 'Addresses' : 'Адреса'}</span>
          </Link>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className={`menu-toggle ${sidebarOpen ? 'open' : ''}`}
              onClick={() => setSidebarOpen(prev => !prev)}
              aria-label="Toggle sidebar"
            >
              <img src="/src/assets/3lines.png" alt="Menu" />
            </button>
            <div className="topbar-logo">{isAdmin ? 'Admin Panel' : 'Partner Panel'}</div>
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="topbar-search"
            disabled
          />
          <div className="topbar-user">
            <span className="user-name">{resolvedName}</span>
            <div className="profile-menu-wrap" ref={profileMenuRef}>
              <button
                type="button"
                className="user-avatar avatar-button"
                onClick={() => setProfileMenuOpen(prev => !prev)}
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
              >
                {(resolvedName || 'A').charAt(0).toUpperCase()}
              </button>

              {profileMenuOpen && (
                <div className="profile-menu" role="menu">
                  {!isAdmin && (
                    <button
                      type="button"
                      className="profile-menu-item"
                      role="menuitem"
                      onClick={() => {
                        setProfileMenuOpen(false)
                        navigate('/my-company')
                      }}
                    >
                      Профиль
                    </button>
                  )}
                  <button
                    type="button"
                    className="profile-menu-item danger"
                    role="menuitem"
                    onClick={() => {
                      setProfileMenuOpen(false)
                      handleLogout()
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="page-content">{children}</div>
      </main>
    </div>
  )
}
