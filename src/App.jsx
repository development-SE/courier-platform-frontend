import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ROUTES } from './constants/routes'

const MobileLayout = lazy(() => import('./components/layout/MobileLayout'))
const RequireAuth = lazy(() => import('./components/auth/RequireAuth'))
const SignInPage = lazy(() => import('./pages/Auth/SignInPage'))
const SignUpPage = lazy(() => import('./pages/Auth/SignUpPage'))
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'))
const OrdersPage = lazy(() => import('./pages/Orders/OrdersPage'))
const OrderDetailPage = lazy(() => import('./pages/Orders/OrderDetailPage'))
const SlotsPage = lazy(() => import('./pages/Slots/SlotsPage'))
const MoneyPage = lazy(() => import('./pages/Money/MoneyPage'))
const MessagesPage = lazy(() => import('./pages/Messages/MessagesPage'))
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage'))
const CourierStatusPage = lazy(() => import('./pages/ProfileDetails/CourierStatusPage'))
const TransportTypePage = lazy(() => import('./pages/ProfileDetails/TransportTypePage'))
const IdentityCheckPage = lazy(() => import('./pages/ProfileDetails/IdentityCheckPage'))
const ParkAccessPage = lazy(() => import('./pages/ProfileDetails/ParkAccessPage'))
const PayoutAccountPage = lazy(() => import('./pages/ProfileDetails/PayoutAccountPage'))
const PayoutHistoryPage = lazy(() => import('./pages/ProfileDetails/PayoutHistoryPage'))
const NotificationsSettingsPage = lazy(() => import('./pages/ProfileDetails/NotificationsSettingsPage'))
const LanguagePage = lazy(() => import('./pages/ProfileDetails/LanguagePage'))

function RouteFallback() {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#eeeef3',
      background: '#0b0b0f',
      fontSize: '14px',
      letterSpacing: '0.02em',
    }}
    >
      Загрузка...
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path={ROUTES.SIGN_IN} element={<SignInPage />} />
          <Route path={ROUTES.SIGN_UP} element={<SignUpPage />} />

          <Route element={<RequireAuth />}>
            <Route element={<MobileLayout />}>
              <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
              <Route path={ROUTES.ORDERS} element={<OrdersPage />} />
              <Route path={ROUTES.ORDER_DETAIL} element={<OrderDetailPage />} />
              <Route path={ROUTES.SLOTS} element={<SlotsPage />} />
              <Route path={ROUTES.MONEY} element={<MoneyPage />} />
              <Route path={ROUTES.MESSAGES} element={<MessagesPage />} />
              <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
              <Route path={ROUTES.PROFILE_STATUS} element={<CourierStatusPage />} />
              <Route path={ROUTES.PROFILE_TRANSPORT} element={<TransportTypePage />} />
              <Route path={ROUTES.PROFILE_IDENTITY} element={<IdentityCheckPage />} />
              <Route path={ROUTES.PROFILE_PARK_ACCESS} element={<ParkAccessPage />} />
              <Route path={ROUTES.PROFILE_PAYOUT_ACCOUNT} element={<PayoutAccountPage />} />
              <Route path={ROUTES.PROFILE_PAYOUT_HISTORY} element={<PayoutHistoryPage />} />
              <Route path={ROUTES.PROFILE_NOTIFICATIONS} element={<NotificationsSettingsPage />} />
              <Route path={ROUTES.PROFILE_LANGUAGE} element={<LanguagePage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
