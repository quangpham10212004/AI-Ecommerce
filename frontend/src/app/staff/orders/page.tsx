import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { fmtPrice } from '@/lib/utils'
import type { Order } from '@/types'

const SC: Record<string, string> = { created:'badge-muted', processing:'badge-warn', completed:'badge-ok', paid:'badge-ok', pending:'badge-warn', failed:'badge-error', delivered:'badge-ok', shipped:'badge-warn' }

export default function StaffOrders() {
  const { data: orders = [], isLoading } = useQuery<Order[]>({ queryKey: ['orders'], queryFn: () => api.get('/orders/orders/').then((r) => r.data) })

  return (
    <div className="p-6 flex flex-col gap-5">
      <h1 className="text-lg font-bold text-white">Quản lý đơn hàng</h1>
      <div className="card overflow-x-auto">
        {isLoading ? <p className="text-gray-500 text-sm py-4">Đang tải...</p> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/[0.07]">
              {['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái', 'Thanh toán', 'Giao hàng'].map((h) => (
                <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="py-3 px-3 font-semibold text-white">{o.order_number}</td>
                  <td className="py-3 px-3"><p className="text-white">{o.customer_name}</p><p className="text-xs text-gray-500">{o.customer_email}</p></td>
                  <td className="py-3 px-3 text-emerald-400 font-medium">{fmtPrice(o.total_amount)}</td>
                  <td className="py-3 px-3"><span className={`badge ${SC[o.status] ?? 'badge-muted'}`}>{o.status}</span></td>
                  <td className="py-3 px-3"><span className={`badge ${SC[o.payment_status] ?? 'badge-muted'}`}>{o.payment_status}</span></td>
                  <td className="py-3 px-3"><span className={`badge ${SC[o.shipping_status] ?? 'badge-muted'}`}>{o.shipping_status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
