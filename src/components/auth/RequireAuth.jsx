import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isAuthorized } from '../../services/authService'
import { ROUTES } from '../../constants/routes'

export default function RequireAuth() {
  const location = useLocation()

  if (!isAuthorized()) {
    return <Navigate to={ROUTES.SIGN_IN} replace state={{ from: location }} />
  }

  return <Outlet />
}
