import { UsersPage } from '../pages/Users/UsersPage'
import { CompaniesPage } from '../pages/Companies/CompaniesPage'
import { AddressesPage } from '../pages/Addresses/AddressesPage'
import { MyCompanyPage } from '../pages/MyCompany/MyCompanyPage'
import { OrdersPage } from '../pages/Orders/OrdersPage'
import { OrderCreatePage } from '../pages/Orders/OrderCreatePage'
import { OrderDetailsPage } from '../pages/Orders/OrderDetailsPage'
import { SignInPage } from '../pages/Auth/SignInPage'
import { SignUpPage } from '../pages/Auth/SignUpPage'

export const routes = [
  {
    path: '/sign-in',
    element: <SignInPage />,
    label: 'Sign In',
  },
  {
    path: '/sign-up',
    element: <SignUpPage />,
    label: 'Sign Up',
  },
  {
    path: '/my-company',
    element: <MyCompanyPage />,
    label: 'My Company',
  },
  {
    path: '/orders',
    element: <OrdersPage />,
    label: 'Orders',
  },
  {
    path: '/orders/new',
    element: <OrderCreatePage />,
    label: 'New Order',
  },
  {
    path: '/orders/details',
    element: <OrderDetailsPage />,
    label: 'Order Details',
  },
  {
    path: '/orders/details/:orderId',
    element: <OrderDetailsPage />,
    label: 'Order Details By Id',
  },
  {
    path: '/users',
    element: <UsersPage />,
    label: 'Users',
  },
  {
    path: '/companies',
    element: <CompaniesPage />,
    label: 'Companies',
  },
  {
    path: '/addresses',
    element: <AddressesPage />,
    label: 'Addresses',
  },
]
