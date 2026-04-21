import { Outlet } from 'react-router-dom'
import CustomerNav from './CustomerNav'
import Sidebar from './Sidebar'
import AIChatPanel from '@/components/chat/AIChatPanel'

export function CustomerLayout() {
  return (
    <div className="min-h-screen bg-bg">
      <CustomerNav />
      <main><Outlet /></main>
      <AIChatPanel />
    </div>
  )
}

export function DashboardLayout({ role }: { role: 'admin' | 'staff' }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar role={role} />
      <main className="flex-1 overflow-auto"><Outlet /></main>
    </div>
  )
}
