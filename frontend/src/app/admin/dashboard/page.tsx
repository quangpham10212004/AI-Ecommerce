import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import DashboardCard from '@/components/dashboard/DashboardCard'
import type { Order, Product } from '@/types'
import { DollarSign, ShoppingBag, Package, Users, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  created:    { label: 'Mới tạo',    cls: 'badge-muted' },
  processing: { label: 'Đang xử lý', cls: 'badge-warn' },
  completed:  { label: 'Hoàn thành', cls: 'badge-ok' },
  cancelled:  { label: 'Đã hủy',     cls: 'badge-error' },
}

export default function AdminDashboard() {
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ['products'], queryFn: () => api.get('/products/').then((r) => r.data) })
  const { data: orders = [] } = useQuery<Order[]>({ queryKey: ['orders'], queryFn: () => api.get('/orders/orders/').then((r) => r.data) })
  const { data: users } = useQuery<{ admins: number; staff: number; customers: number }>({ queryKey: ['userSummary'], queryFn: () => api.get('/users/summary/').then((r) => r.data) })

  const revenue = orders.reduce((s, o) => s + Number(o.total_amount), 0)
  const pending = orders.filter((o) => o.status === 'processing' || o.status === 'created').length
  const completed = orders.filter((o) => o.status === 'completed').length

  return (
    <div className="px-6 py-8 flex flex-col gap-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl text-white mb-1">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">Tổng quan hệ thống và hoạt động kinh doanh</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <DashboardCard
          label="Doanh thu"
          value={revenue > 0 ? revenue.toLocaleString('vi-VN') + '₫' : '—'}
          color="text-success"
          icon={<DollarSign size={16} />}
          sub="Tổng cộng"
        />
        <DashboardCard
          label="Đơn hàng"
          value={orders.length}
          color="text-accentLight"
          icon={<ShoppingBag size={16} />}
          sub="Tất cả đơn"
        />
        <DashboardCard
          label="Đang xử lý"
          value={pending}
          color="text-warning"
          icon={<Clock size={16} />}
          sub="Chờ xác nhận"
        />
        <DashboardCard
          label="Hoàn thành"
          value={completed}
          color="text-success"
          icon={<CheckCircle2 size={16} />}
          sub="Đã giao"
        />
        <DashboardCard
          label="Sản phẩm"
          value={products.length}
          color="text-neon"
          icon={<Package size={16} />}
          sub="Trong kho"
        />
        <DashboardCard
          label="Người dùng"
          value={(users?.customers ?? 0) + (users?.staff ?? 0) + (users?.admins ?? 0)}
          color="text-accentLight"
          icon={<Users size={16} />}
          sub="Tổng tài khoản"
        />
      </div>

      {/* User breakdown + Recent orders */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* User stats */}
        <div className="card flex flex-col gap-4">
          <h2 className="font-display font-bold text-base text-white flex items-center gap-2">
            <Users size={15} className="text-accentLight" /> Phân loại người dùng
          </h2>
          {[
            { label: 'Khách hàng', value: users?.customers ?? 0, color: 'bg-accentLight', pct: ((users?.customers ?? 0) / Math.max((users?.customers ?? 0) + (users?.staff ?? 0) + (users?.admins ?? 0), 1)) * 100 },
            { label: 'Nhân viên', value: users?.staff ?? 0, color: 'bg-indigo-400', pct: ((users?.staff ?? 0) / Math.max((users?.customers ?? 0) + (users?.staff ?? 0) + (users?.admins ?? 0), 1)) * 100 },
            { label: 'Admin', value: users?.admins ?? 0, color: 'bg-fuchsia-400', pct: ((users?.admins ?? 0) / Math.max((users?.customers ?? 0) + (users?.staff ?? 0) + (users?.admins ?? 0), 1)) * 100 },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-400 font-medium">{item.label}</span>
                <span className="text-white font-bold">{item.value}</span>
              </div>
              <div className="h-1.5 bg-surface3 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full transition-all duration-700`}
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Recent orders */}
        <div className="card xl:col-span-2">
          <h2 className="font-display font-bold text-base text-white mb-5 flex items-center gap-2">
            <TrendingUp size={15} className="text-accentLight" /> Đơn hàng gần đây
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái'].map((h) => (
                    <th key={h} className="table-head">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 8).map((o) => {
                  const s = STATUS_CONFIG[o.status] ?? { label: o.status, cls: 'badge-muted' }
                  return (
                    <tr key={o.id} className="table-row">
                      <td className="table-cell font-mono text-xs text-accentLight font-semibold">{o.order_number}</td>
                      <td className="table-cell text-gray-300">{o.customer_name}</td>
                      <td className="table-cell text-success font-bold">{Number(o.total_amount).toLocaleString('vi-VN')}₫</td>
                      <td className="table-cell"><span className={`badge ${s.cls}`}>{s.label}</span></td>
                    </tr>
                  )
                })}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="table-cell text-center text-gray-600 py-8">
                      <AlertCircle size={20} className="mx-auto mb-2 opacity-40" />
                      Chưa có đơn hàng nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
