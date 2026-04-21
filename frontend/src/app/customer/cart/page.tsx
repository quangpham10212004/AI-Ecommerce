import { useCartStore } from '@/stores/cartStore'
import { productIcon, fmtPrice } from '@/lib/utils'
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CartPage() {
  const { items, remove, changeQty, total, count } = useCartStore()

  if (!count()) return (
    <div className="flex flex-col items-center justify-center gap-5 min-h-[70vh] text-center px-6 animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-surface3 border border-white/[0.06] flex items-center justify-center">
        <ShoppingBag size={32} className="text-gray-600" />
      </div>
      <div>
        <p className="text-white font-bold text-lg mb-1">Giỏ hàng trống</p>
        <p className="text-gray-500 text-sm">Hãy thêm sản phẩm vào giỏ hàng để tiếp tục</p>
      </div>
      <Link to="/customer/products" className="btn btn-primary px-6">
        Mua sắm ngay <ArrowRight size={14} />
      </Link>
    </div>
  )

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-white mb-1">Giỏ hàng</h1>
        <p className="text-sm text-gray-500">{count()} sản phẩm</p>
      </div>

      <div className="card flex flex-col divide-y divide-white/[0.05] p-0 overflow-hidden">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors">
            <div className="w-14 h-14 rounded-xl bg-surface3 border border-white/[0.06] flex items-center justify-center text-2xl shrink-0">
              {productIcon(item.icon)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-white truncate">{item.name}</p>
              <p className="text-xs text-success mt-0.5">{fmtPrice(item.price)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => changeQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-surface3 border border-white/[0.08] text-gray-400 hover:text-white hover:border-accent/40 transition-all flex items-center justify-center">
                <Minus size={12} />
              </button>
              <span className="w-6 text-center text-sm font-bold text-white">{item.qty}</span>
              <button onClick={() => changeQty(item.id, 1)} className="w-7 h-7 rounded-lg bg-surface3 border border-white/[0.08] text-gray-400 hover:text-white hover:border-accent/40 transition-all flex items-center justify-center">
                <Plus size={12} />
              </button>
            </div>
            <p className="text-sm font-bold text-success w-28 text-right shrink-0">{fmtPrice(item.price * item.qty)}</p>
            <button onClick={() => remove(item.id)} className="p-1.5 text-gray-600 hover:text-danger transition-colors shrink-0">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="card flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">Tổng cộng</p>
          <p className="text-2xl font-bold font-display text-success">{fmtPrice(total())}</p>
        </div>
        <Link to="/customer/checkout" className="btn btn-primary px-6 py-3">
          Thanh toán <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}
