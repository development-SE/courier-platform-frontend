import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { PartnerLayout } from '../layouts/PartnerLayout'
import { UsersPage } from '../pages/Users/UsersPage'
import { CompaniesPage } from '../pages/Companies/CompaniesPage'
import { AddressesPage } from '../pages/Addresses/AddressesPage'
import { MyCompanyPage } from '../pages/MyCompany/MyCompanyPage'
import { OrdersPage } from '../pages/Orders/OrdersPage'
import { OrderCreatePage } from '../pages/Orders/OrderCreatePage'
import { OrderDetailsPage } from '../pages/Orders/OrderDetailsPage'
import { SignInPage } from '../pages/Auth/SignInPage'
import { SignUpPage } from '../pages/Auth/SignUpPage'
import { auth } from '../utils/auth'
import './App.css'

const RequireAuth = ({ children, allowedRoles = [] }) => {
  const location = useLocation()
  const session = auth.getSession()

  if (!session) {
    return <Navigate to="/sign-in" replace state={{ from: location }} />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    return <Navigate to={auth.getDefaultRoute(session)} replace />
  }

  return children
}

const GuestOnly = ({ children }) => {
  const session = auth.getSession()
  if (session) {
    return <Navigate to={auth.getDefaultRoute(session)} replace />
  }

  return children
}

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/sign-in"
          element={
            <GuestOnly>
              <SignInPage />
            </GuestOnly>
          }
        />
        <Route
          path="/sign-up"
          element={
            <GuestOnly>
              <SignUpPage />
            </GuestOnly>
          }
        />

        <Route
          path="/my-company"
          element={
            <RequireAuth allowedRoles={['PARTNER']}>
              <PartnerLayout currentPage="my-company">
                <MyCompanyPage />
              </PartnerLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/orders"
          element={
            <RequireAuth allowedRoles={['ADMIN', 'PARTNER']}>
              <PartnerLayout currentPage="orders">
                <OrdersPage />
              </PartnerLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/orders/new"
          element={
            <RequireAuth allowedRoles={['ADMIN', 'PARTNER']}>
              <PartnerLayout currentPage="orders">
                <OrderCreatePage />
              </PartnerLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/orders/details"
          element={
            <RequireAuth allowedRoles={['ADMIN', 'PARTNER']}>
              <PartnerLayout currentPage="order-details">
                <OrderDetailsPage />
              </PartnerLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/orders/details/:orderId"
          element={
            <RequireAuth allowedRoles={['ADMIN', 'PARTNER']}>
              <PartnerLayout currentPage="order-details">
                <OrderDetailsPage />
              </PartnerLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/users"
          element={
            <RequireAuth allowedRoles={['ADMIN', 'PARTNER']}>
              <PartnerLayout currentPage="users">
                <UsersPage />
              </PartnerLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/companies"
          element={
            <RequireAuth allowedRoles={['ADMIN']}>
              <PartnerLayout currentPage="companies">
                <CompaniesPage />
              </PartnerLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/addresses"
          element={
            <RequireAuth allowedRoles={['ADMIN', 'PARTNER']}>
              <PartnerLayout currentPage="addresses">
                <AddressesPage />
              </PartnerLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/"
          element={<Navigate to={auth.getDefaultRoute()} replace />}
        />
      </Routes>
    </Router>
  )
}

export default App
