import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCartStore } from '@/stores/cartStore'
import { useAuthStore } from '@/stores/authStore'
import { productIcon, fmtPrice } from '@/lib/utils'
import api from '@/lib/api'
import { ArrowLeft, CreditCard, Building2, Truck, Smartphone, CheckCircle2 } from 'lucide-react'

const METHODS = [
  { value: 'credit_card', label: 'Thẻ tín dụng / Ghi nợ', icon: <CreditCard size={16} /> },
  { value: 'bank_transfer', label: 'Chuyển khoản ngân hàng', icon: <Building2 size={16} /> },
  { value: 'cod', label: 'COD — Thanh toán khi nhận', icon: <Truck size={16} /> },
  { value: 'e_wallet', label: 'Ví điện tử (MoMo / ZaloPay)', icon: <Smartphone size={16} /> },
]

export default function CheckoutPage() {
  const { items, total, clear } = useCartStore()
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: user?.full_name ?? '', email: user?.email ?? '', address: '', method: 'credit_card' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  if (!items.length) return (
    <div className="p-6 text-center text-gray-500 text-sm">
      Giỏ hàng trống. <Link to="/customer/products" className="text-accentLight hover:underline">Mua sắm ngay</Link>
    </div>
  )

  const place = async () => {
    if (!form.name || !form.email) return
    setLoading(true)
    const orderNum = 'ORD-' + Date.now()
    const t = total()
    try {
      await api.post('/orders/orders/', { order_number: orderNum, customer_name: form.name, customer_email: form.email, status: 'created', payment_status: 'pending', shipping_status: 'pending', total_amount: String(t) })
      await api.post('/payments/payments/', { order_number: orderNum, customer_name: form.name, amount: String(t), method: form.method, status: 'pending', transaction_ref: 'TXN-' + Date.now() })
      clear()
      setResult({ ok: true, msg: `Đặt hàng thành công! Mã đơn: ${orderNum}` })
      setTimeout(() => navigate('/customer/orders'), 2500)
    } catch {
      setResult({ ok: false, msg: 'Có lỗi xảy ra, vui lòng thử lại.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-7">
        <Link to="/customer/cart" className="btn btn-ghost text-xs py-1.5 px-3"><ArrowLeft size={13} /> Giỏ hàng</Link>
        <h1 className="font-display font-extrabold text-2xl text-white">Thanh toán</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        <div className="flex flex-col gap-4">
          {/* Shipping info */}
          <div className="card flex flex-col gap-4">
            <h3 className="font-display font-bold text-white">Thông tin giao hàng</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Họ tên</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Email</label>
                <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Địa chỉ</label>
              <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Đường ABC, Quận 1, TP.HCM" />
            </div>
          </div>

          {/* Payment method */}
          <div className="card flex flex-col gap-3">
            <h3 className="font-display font-bold text-white">Phương thức thanh toán</h3>
            {METHODS.map((m) => (
              <label key={m.value} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${form.method === m.value ? 'border-accent/50 bg-accent/10' : 'border-white/[0.07] hover:border-white/20 hover:bg-white/[0.02]'}`}>
                <input type="radio" name="method" value={m.value} checked={form.method === m.value} onChange={() => setForm({ ...form, method: m.value })} className="accent-accent" />
                <span className={form.method === m.value ? 'text-accentLight' : 'text-gray-500'}>{m.icon}</span>
                <span className={`text-sm font-medium ${form.method === m.value ? 'text-white' : 'text-gray-400'}`}>{m.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Order summary */}
        <div className="card flex flex-col gap-4 h-fit">
          <h3 className="font-display font-bold text-white">Tóm tắt đơn hàng</h3>
          <div className="flex flex-col divide-y divide-white/[0.05]">
            {items.map((i) => (
              <div key={i.id} className="flex justify-between py-3 text-sm">
                <span className="text-gray-400 flex items-center gap-2">
                  <span>{productIcon(i.icon)}</span>
                  <span className="truncate max-w-[120px]">{i.name}</span>
                  <span className="text-gray-600">×{i.qty}</span>
                </span>
                <span className="text-success font-semibold shrink-0">{fmtPrice(i.price * i.qty)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold border-t border-white/[0.07] pt-3">
            <span className="text-gray-300">Tổng cộng</span>
            <span className="text-success text-lg">{fmtPrice(total())}</span>
          </div>

          {result && (
            <div className={`flex items-start gap-2 text-sm px-3 py-2.5 rounded-xl border ${result.ok ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20'}`}>
              {result.ok && <CheckCircle2 size={15} className="shrink-0 mt-0.5" />}
              {result.msg}
            </div>
          )}

          <button onClick={place} disabled={loading || !!result?.ok} className="btn btn-primary w-full py-3">
            {loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Đang xử lý...</span> : 'Đặt hàng'}
          </button>
        </div>
      </div>
    </div>
  )
}
