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
  const role = session?.role || ''
  const isAdmin    = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const isDirector = role === 'DIRECTOR' || role === 'PARTNER'
  const isManager  = role === 'MANAGER'
  const isActive   = (page) => currentPage === page

  const panelTitle = isAdmin ? 'Admin Panel' : isDirector ? 'Director Panel' : 'Manager Panel'

  const resolvedName = useMemo(() => {
    if (isAdmin) return 'Admin'
    return topbarName || session?.name || (isDirector ? 'Director' : 'Manager')
  }, [isAdmin, isDirector, session?.name, topbarName])

  const handleLogout = () => {
    auth.signOut()
    navigate('/sign-in', { replace: true })
  }

  useEffect(() => {
    if (isAdmin) return undefined

    const syncTopbarName = () => {
      const users = storage.getUsers?.() || []
      const director = users.find(user => user.role?.toUpperCase() === 'DIRECTOR')
      const directorName = director
        ? `${director.firstName || ''} ${director.lastName || ''}`.trim()
        : ''
      setTopbarName(directorName || session?.name || '')
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
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`partner-layout ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <aside className="sidebar">
        <nav className="sidebar-nav">

          {/* ── ADMIN sidebar ── */}
          {isAdmin && (
            <>
              <Link to="/"         className={`nav-link ${isActive('home')      ? 'active' : ''}`}>
                <span className="nav-icon"><img src="/src/assets/Home.png" alt="" /></span>
                <span className="nav-text">Home</span>
              </Link>
              <Link to="/orders"   className={`nav-link ${isActive('orders')    ? 'active' : ''}`}>
                <span className="nav-icon"><img src="/src/assets/order.png" alt="" /></span>
                <span className="nav-text">Заказы</span>
              </Link>
              <Link to="/companies" className={`nav-link ${isActive('companies') ? 'active' : ''}`}>
                <span className="nav-icon"><img src="/src/assets/Companies.png" alt="" /></span>
                <span className="nav-text">Companies</span>
              </Link>
              <Link to="/users"    className={`nav-link ${isActive('users')     ? 'active' : ''}`}>
                <span className="nav-icon"><img src="/src/assets/Users.png" alt="" /></span>
                <span className="nav-text">Employees</span>
              </Link>
              <Link to="/clients"  className={`nav-link ${isActive('clients')   ? 'active' : ''}`}>
                <span className="nav-icon"><img src="/src/assets/Users.png" alt="" /></span>
                <span className="nav-text">Clients</span>
              </Link>
              <Link to="/couriers" className={`nav-link ${isActive('couriers')  ? 'active' : ''}`}>
                <span className="nav-icon"><img src="/src/assets/Users.png" alt="" /></span>
                <span className="nav-text">Couriers</span>
              </Link>
              <Link to="/addresses" className={`nav-link ${isActive('addresses') ? 'active' : ''}`}>
                <span className="nav-icon"><img src="/src/assets/Address.png" alt="" /></span>
                <span className="nav-text">Addresses</span>
              </Link>
            </>
          )}

          {/* ── DIRECTOR / PARTNER sidebar ── */}
          {isDirector && (
            <>
              <Link to="/"                className={`nav-link ${isActive('home')            ? 'active' : ''}`}>
                <span className="nav-icon"><img src="/src/assets/Home.png" alt="" /></span>
                <span className="nav-text">Home</span>
              </Link>
              <Link to="/orders"          className={`nav-link ${isActive('orders')          ? 'active' : ''}`}>
                <span className="nav-icon"><img src="/src/assets/order.png" alt="" /></span>
                <span className="nav-text">Заказы</span>
              </Link>
              <Link to="/users"           className={`nav-link ${isActive('users')           ? 'active' : ''}`}>
                <span className="nav-icon"><img src="/src/assets/Users.png" alt="" /></span>
                <span className="nav-text">Сотрудники</span>
              </Link>
              <Link to="/addresses"       className={`nav-link ${isActive('addresses')       ? 'active' : ''}`}>
                <span className="nav-icon"><img src="/src/assets/Address.png" alt="" /></span>
                <span className="nav-text">Адреса</span>
              </Link>
              <Link to="/clients"         className={`nav-link ${isActive('clients')         ? 'active' : ''}`}>
                <span className="nav-icon"><img src="/src/assets/Users.png" alt="" /></span>
                <span className="nav-text">Clients</span>
              </Link>
              <Link to="/catalog"         className={`nav-link ${isActive('catalog')         ? 'active' : ''}`}>
                <span className="nav-icon"><img src="/src/assets/Home.png" alt="" /></span>
                <span className="nav-text">Каталог</span>
              </Link>
            </>
          )}

          {/* ── MANAGER sidebar ── */}
          {isManager && (
            <>
              <Link to="/"          className={`nav-link ${isActive('home')       ? 'active' : ''}`}>
                <span className="nav-icon"><img src="/src/assets/Home.png" alt="" /></span>
                <span className="nav-text">Home</span>
              </Link>
              <Link to="/my-company" className={`nav-link ${isActive('my-company') ? 'active' : ''}`}>
                <span className="nav-icon"><img src="/src/assets/Companies.png" alt="" /></span>
                <span className="nav-text">Компания</span>
              </Link>
              <Link to="/orders"     className={`nav-link ${isActive('orders')     ? 'active' : ''}`}>
                <span className="nav-icon"><img src="/src/assets/order.png" alt="" /></span>
                <span className="nav-text">Заказы</span>
              </Link>
              <Link to="/clients"    className={`nav-link ${isActive('clients')    ? 'active' : ''}`}>
                <span className="nav-icon"><img src="/src/assets/Users.png" alt="" /></span>
                <span className="nav-text">Clients</span>
              </Link>
              <Link to="/addresses"  className={`nav-link ${isActive('addresses')  ? 'active' : ''}`}>
                <span className="nav-icon"><img src="/src/assets/Address.png" alt="" /></span>
                <span className="nav-text">Адреса</span>
              </Link>
            </>
          )}

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
            <div className="topbar-logo">{panelTitle}</div>
          </div>

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
                      {isDirector ? 'Профиль ' : 'Профиль'}
                    </button>
                  )}
                  {isDirector && (
                    <button
                    
                      type="button"
                      className="profile-menu-item"
                      role="menuitem"
                      onClick={() => {
                        setProfileMenuOpen(false)
                        navigate('/company-settings')
                      }}
                    >
                      Настройки
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
