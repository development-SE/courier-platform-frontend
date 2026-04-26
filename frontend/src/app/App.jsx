import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { PartnerLayout } from '../layouts/PartnerLayout'
import { UsersPage } from '../pages/Users/UsersPage'
import { CompaniesPage } from '../pages/Companies/CompaniesPage'
import { AddressesPage } from '../pages/Addresses/AddressesPage'
import { MyCompanyPage } from '../pages/MyCompany/MyCompanyPage'
import { OrdersPage } from '../pages/Orders/OrdersPage'
import { OrderCreatePage } from '../pages/Orders/OrderCreatePage'
import { OrderDetailsPage } from '../pages/Orders/OrderDetailsPage'
import { ClientPage } from '../pages/Clients/ClientPage'
import { CourierPage } from '../pages/Couriers/CourierPage'
import { CompanySettingsPage } from '../pages/CompanySettings/CompanySettingsPage'
import { CatalogPage } from '../pages/Catalog/CatalogPage'
import { SignInPage } from '../pages/Auth/SignInPage'
import { SignUpPage } from '../pages/Auth/SignUpPage'
import { HomePage } from '../pages/Home/HomePage'
import { auth } from '../utils/auth'
import './App.css'

const DIRECTOR_ROLES = ['DIRECTOR', 'PARTNER']
const ADMIN_ROLES    = ['ADMIN', 'SUPER_ADMIN']
const ALL_STAFF      = [...ADMIN_ROLES, ...DIRECTOR_ROLES, 'MANAGER']

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

function App() {
  return (
    <Router>
      <Routes>
        {/* Home */}
        <Route
          path="/"
          element={
            <RequireAuth allowedRoles={ALL_STAFF}>
              <PartnerLayout currentPage="home">
                <HomePage />
              </PartnerLayout>
            </RequireAuth>
          }
        />

        {/* Auth */}
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />

        {/* My Company — Director / Partner / Manager */}
        <Route
          path="/my-company"
          element={
            <RequireAuth allowedRoles={[...DIRECTOR_ROLES, 'MANAGER']}>
              <PartnerLayout currentPage="my-company">
                <MyCompanyPage />
              </PartnerLayout>
            </RequireAuth>
          }
        />

        {/* Orders — all staff */}
        <Route
          path="/orders"
          element={
            <RequireAuth allowedRoles={ALL_STAFF}>
              <PartnerLayout currentPage="orders">
                <OrdersPage />
              </PartnerLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/orders/new"
          element={
            <RequireAuth allowedRoles={ALL_STAFF}>
              <PartnerLayout currentPage="orders">
                <OrderCreatePage />
              </PartnerLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/orders/details"
          element={
            <RequireAuth allowedRoles={ALL_STAFF}>
              <PartnerLayout currentPage="order-details">
                <OrderDetailsPage />
              </PartnerLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/orders/details/:orderId"
          element={
            <RequireAuth allowedRoles={ALL_STAFF}>
              <PartnerLayout currentPage="order-details">
                <OrderDetailsPage />
              </PartnerLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/couriers"
          element={
            <RequireAuth allowedRoles={ADMIN_ROLES}>
              <PartnerLayout currentPage="couriers">
                <CourierPage />
              </PartnerLayout>
            </RequireAuth>
          }
        />

        {/* Users/Employees — Admin + Director */}
        <Route
          path="/users"
          element={
            <RequireAuth allowedRoles={[...ADMIN_ROLES, ...DIRECTOR_ROLES]}>
              <PartnerLayout currentPage="users">
                <UsersPage />
              </PartnerLayout>
            </RequireAuth>
          }
        />

        {/* Companies — Admin only */}
        <Route
          path="/clients"
          element={
            <RequireAuth allowedRoles={[...ADMIN_ROLES, ...DIRECTOR_ROLES, 'MANAGER']}>
              <PartnerLayout currentPage="clients">
                <ClientPage />
              </PartnerLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/companies"
          element={
            <RequireAuth allowedRoles={ADMIN_ROLES}>
              <PartnerLayout currentPage="companies">
                <CompaniesPage />
              </PartnerLayout>
            </RequireAuth>
          }
        />

        {/* Addresses — all staff */}
        <Route
          path="/addresses"
          element={
            <RequireAuth allowedRoles={ALL_STAFF}>
              <PartnerLayout currentPage="addresses">
                <AddressesPage />
              </PartnerLayout>
            </RequireAuth>
          }
        />

        {/* Director-only pages */}
        <Route
          path="/company-settings"
          element={
            <RequireAuth allowedRoles={DIRECTOR_ROLES}>
              <PartnerLayout currentPage="company-settings">
                <CompanySettingsPage />
              </PartnerLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/catalog"
          element={
            <RequireAuth allowedRoles={DIRECTOR_ROLES}>
              <PartnerLayout currentPage="catalog">
                <CatalogPage />
              </PartnerLayout>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
