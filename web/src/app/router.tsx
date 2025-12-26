import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { EnvGate } from './routes/EnvGate'
import { Protected } from './routes/Protected'
import { RoleGate } from './routes/RoleGate'
import { LoginPage } from '../features/auth/LoginPage'
import { PendingLinkPage } from '../features/auth/PendingLinkPage'
import { SetupPage } from '../features/auth/SetupPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { ProductsPage } from '../features/products/ProductsPage'
import { ReceiveProductPage } from '../features/products/ReceiveProductPage'
import { WarehouseSettingsPage } from '../features/warehouse/WarehouseSettingsPage'

export const router = createBrowserRouter([
  { path: '/setup', element: <SetupPage /> },
  {
    element: <EnvGate />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/pendente', element: <PendingLinkPage /> },
      {
        element: <Protected />,
        children: [
          {
            element: <AppShell />,
            children: [
              { index: true, element: <Navigate to="/dashboard" replace /> },
              { path: '/dashboard', element: <DashboardPage /> },
              { path: '/produtos', element: <ProductsPage /> },
              {
                element: <RoleGate allow={['analyst', 'manager']} />,
                children: [{ path: '/recebimentos', element: <ReceiveProductPage /> }],
              },
              {
                element: <RoleGate allow={['manager']} />,
                children: [{ path: '/config/galpao', element: <WarehouseSettingsPage /> }],
              },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])


