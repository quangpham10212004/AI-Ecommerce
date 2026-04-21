import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { RequireAuth } from '@/components/layout/RequireAuth'
import { CustomerLayout, DashboardLayout } from '@/components/layout/Layouts'
import LoginPage from '@/app/LoginPage'
import CustomerHome from '@/app/customer/home/page'
import ProductsPage from '@/app/customer/products/page'
import CartPage from '@/app/customer/cart/page'
import CheckoutPage from '@/app/customer/checkout/page'
import OrdersPage from '@/app/customer/orders/page'
import StaffDashboard from '@/app/staff/dashboard/page'
import StaffOrders from '@/app/staff/orders/page'
import AdminDashboard from '@/app/admin/dashboard/page'
import AdminProducts from '@/app/admin/products/page'
import AdminUsers from '@/app/admin/users/page'
import ProductDetailPage from '@/app/customer/product/[id]/page'

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },

  {
    element: <RequireAuth role="customer" />,
    children: [{
      element: <CustomerLayout />,
      children: [
        { path: '/customer/home', element: <CustomerHome /> },
        { path: '/customer/products', element: <ProductsPage /> },
        { path: '/customer/cart', element: <CartPage /> },
        { path: '/customer/checkout', element: <CheckoutPage /> },
        { path: '/customer/orders', element: <OrdersPage /> },
        { path: '/customer/product/:id', element: <ProductDetailPage /> },
      ],
    }],
  },

  {
    element: <RequireAuth role="staff" />,
    children: [{
      element: <DashboardLayout role="staff" />,
      children: [
        { path: '/staff/dashboard', element: <StaffDashboard /> },
        { path: '/staff/orders', element: <StaffOrders /> },
      ],
    }],
  },

  {
    element: <RequireAuth role="admin" />,
    children: [{
      element: <DashboardLayout role="admin" />,
      children: [
        { path: '/admin/dashboard', element: <AdminDashboard /> },
        { path: '/admin/products', element: <AdminProducts /> },
        { path: '/admin/users', element: <AdminUsers /> },
      ],
    }],
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
