import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'
import { fmtPrice } from '@/lib/utils'
import { ShoppingBag, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Order } from '@/types'

const SC: Record<string, string> = {
  created: 'badge-muted', processing: 'badge-warn', completed: 'badge-ok',
  paid: 'badge-ok', pending: 'badge-warn', failed: 'badge-error',
  delivered: 'badge-ok', shipped: 'badge-warn',
}

export default function OrdersPage() {
  const user = useAuthStore((s) => s.user)
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders/orders/').then((r) => r.data),
  })
  const mine = orders.filter((o) => o.customer_email === user?.email)

  return (
    <div className="px-6 py-8 flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-white mb-1">Đơn hàng của tôi</h1>
        <p className="text-sm text-gray-500">{mine.length} đơn hàng</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-16 w-full" />)}
        </div>
      ) : !mine.length ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface3 border border-white/[0.06] flex items-center justify-center">
            <ShoppingBag size={24} className="text-gray-600" />
          </div>
          <p className="text-white font-semibold">Chưa có đơn hàng nào</p>
          <Link to="/customer/products" className="btn btn-primary text-sm">
            Mua sắm ngay <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Mã đơn', 'Tổng tiền', 'Trạng thái', 'Thanh toán', 'Giao hàng'].map((h) => (
                  <th key={h} className="table-head">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mine.map((o) => (
                <tr key={o.id} className="table-row">
                  <td className="table-cell font-mono text-xs text-accentLight font-semibold">{o.order_number}</td>
                  <td className="table-cell text-success font-bold">{fmtPrice(o.total_amount)}</td>
                  <td className="table-cell"><span className={`badge ${SC[o.status] ?? 'badge-muted'}`}>{o.status}</span></td>
                  <td className="table-cell"><span className={`badge ${SC[o.payment_status] ?? 'badge-muted'}`}>{o.payment_status}</span></td>
                  <td className="table-cell"><span className={`badge ${SC[o.shipping_status] ?? 'badge-muted'}`}>{o.shipping_status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
