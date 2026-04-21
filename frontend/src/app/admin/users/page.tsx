import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { User } from '@/types'

const TABS = [
  { key: 'customers', label: 'Khách hàng' },
  { key: 'staff', label: 'Staff' },
  { key: 'admins', label: 'Admin' },
] as const

export default function AdminUsers() {
  const [tab, setTab] = useState<'customers' | 'staff' | 'admins'>('customers')
  const { data: users = [], isLoading } = useQuery<User[]>({ queryKey: ['users', tab], queryFn: () => api.get(`/users/${tab}/`).then((r) => r.data) })

  return (
    <div className="p-6 flex flex-col gap-5">
      <h1 className="text-lg font-bold text-white">Quản lý người dùng</h1>
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === t.key ? 'bg-accent text-white' : 'bg-surface2 text-gray-400 hover:text-white border border-white/[0.07]'}`}>{t.label}</button>
        ))}
      </div>
      <div className="card overflow-x-auto">
        {isLoading ? <p className="text-gray-500 text-sm py-4">Đang tải...</p> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/[0.07]">
              {['Họ tên', 'Email', 'Điện thoại', 'Chi tiết', 'Trạng thái'].map((h) => (
                <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="py-3 px-3 font-semibold text-white">{u.full_name}</td>
                  <td className="py-3 px-3 text-gray-400">{u.email}</td>
                  <td className="py-3 px-3 text-gray-400">{u.phone}</td>
                  <td className="py-3 px-3 text-xs text-gray-500">{u.department ?? u.loyalty_tier ?? u.permissions_scope ?? '—'}</td>
                  <td className="py-3 px-3"><span className={`badge ${u.is_active ? 'badge-ok' : 'badge-error'}`}>{u.is_active ? 'active' : 'inactive'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
