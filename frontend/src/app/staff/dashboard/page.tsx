import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import DashboardCard from '@/components/dashboard/DashboardCard'
import type { Order, Payment } from '@/types'
import { ShoppingBag, Clock, CheckCircle2, CreditCard, TrendingUp, AlertCircle } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  created:    { label: 'Mới tạo',    cls: 'badge-muted' },
  processing: { label: 'Đang xử lý', cls: 'badge-warn' },
  completed:  { label: 'Hoàn thành', cls: 'badge-ok' },
  cancelled:  { label: 'Đã hủy',     cls: 'badge-error' },
}

export default function StaffDashboard() {
  const { data: orders = [] } = useQuery<Order[]>({ queryKey: ['orders'], queryFn: () => api.get('/orders/orders/').then((r) => r.data) })
  const { data: payments = [] } = useQuery<Payment[]>({ queryKey: ['payments'], queryFn: () => api.get('/payments/payments/').then((r) => r.data) })

  const pending = orders.filter((o) => o.status === 'created' || o.status === 'processing').length
  const done = orders.filter((o) => o.status === 'completed').length

  return (
    <div className="px-6 py-8 flex flex-col gap-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl text-white mb-1">Staff Dashboard</h1>
        <p className="text-sm text-gray-500">Quản lý đơn hàng và theo dõi thanh toán</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard label="Tổng đơn" value={orders.length} color="text-accentLight" icon={<ShoppingBag size={16} />} sub="Tất cả đơn" />
        <DashboardCard label="Chờ xử lý" value={pending} color="text-warning" icon={<Clock size={16} />} sub="Cần xác nhận" />
        <DashboardCard label="Hoàn thành" value={done} color="text-success" icon={<CheckCircle2 size={16} />} sub="Đã giao" />
        <DashboardCard label="Thanh toán" value={payments.length} color="text-neon" icon={<CreditCard size={16} />} sub="Đã ghi nhận" />
      </div>

      {/* Recent orders */}
      <div className="card">
        <h2 className="font-display font-bold text-base text-white mb-5 flex items-center gap-2">
          <TrendingUp size={15} className="text-accentLight" /> Đơn hàng cần xử lý
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
              {orders.filter((o) => o.status !== 'completed').slice(0, 10).map((o) => {
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
              {orders.filter((o) => o.status !== 'completed').length === 0 && (
                <tr>
                  <td colSpan={4} className="table-cell text-center text-gray-600 py-8">
                    <CheckCircle2 size={20} className="mx-auto mb-2 text-success opacity-60" />
                    <span className="text-success/70">Tất cả đơn đã hoàn thành!</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
