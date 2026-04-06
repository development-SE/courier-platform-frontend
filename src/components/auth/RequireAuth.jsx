import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isAuthorized } from '../../services/authService'
import { ROUTES } from '../../constants/routes'
import { resolveUnauthorizedRedirect } from '@core/use-cases/auth/sessionGuard'

export default function RequireAuth() {
  const location = useLocation()
  const redirectPath = resolveUnauthorizedRedirect({
    isAuthorized: isAuthorized(),
    signInPath: ROUTES.SIGN_IN,
  })

  if (redirectPath) {
    return <Navigate to={redirectPath} replace state={{ from: location }} />
  }

  return <Outlet />
}
