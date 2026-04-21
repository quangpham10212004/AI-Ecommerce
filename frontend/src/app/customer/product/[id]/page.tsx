import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ShoppingCart, Sparkles, Bot } from 'lucide-react'
import api from '@/lib/api'
import { productIcon, fmtPrice } from '@/lib/utils'
import { useCartStore } from '@/stores/cartStore'
import { useChatStore } from '@/stores/chatStore'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import type { Product } from '@/types'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const add = useCartStore((s) => s.add)
  const { toggle, addMessage } = useChatStore()

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: () => api.get(`/products/${id}/`).then((r) => r.data),
  })
  const { data: all = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products/').then((r) => r.data),
  })

  const related = all.filter((p) => p.id !== Number(id) && p.category === product?.category).slice(0, 4)

  const askAI = () => {
    addMessage({ id: Date.now().toString(), role: 'user', text: `Tư vấn cho tôi về sản phẩm ${product?.name}` })
    toggle()
  }

  if (isLoading) return (
    <div className="px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="skeleton h-72 w-full" />
      <div className="flex flex-col gap-3">
        <div className="skeleton h-6 w-1/3" />
        <div className="skeleton h-8 w-3/4" />
        <div className="skeleton h-10 w-1/2" />
        <div className="skeleton h-11 w-full mt-4" />
      </div>
    </div>
  )

  if (!product) return <div className="p-6 text-gray-500 text-sm">Không tìm thấy sản phẩm.</div>

  return (
    <div className="px-6 py-8 flex flex-col gap-10 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors w-fit">
        <ArrowLeft size={14} /> Quay lại
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Visual */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] flex items-center justify-center min-h-[280px]"
          style={{ background: 'linear-gradient(145deg, rgba(124,58,237,0.12) 0%, rgba(79,70,229,0.06) 50%, rgba(14,165,233,0.06) 100%)' }}>
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <span className="text-9xl relative z-10 drop-shadow-2xl">{productIcon(product.image_icon)}</span>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{product.category}</p>
            <h1 className="font-display font-extrabold text-3xl text-white leading-tight">{product.name}</h1>
            {product.ai_match && (
              <div className="flex items-center gap-2 mt-3">
                <span className="badge badge-accent"><Sparkles size={10} /> AI Match {product.ai_match}%</span>
                {product.ai_match >= 95 && <span className="badge badge-ok">Top Pick</span>}
              </div>
            )}
          </div>

          <p className="text-4xl font-bold font-display text-success">{fmtPrice(product.price)}</p>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => { add({ id: product.id, name: product.name, price: Number(product.price), icon: product.image_icon }); navigate('/customer/cart') }}
              className="btn btn-primary w-full py-3.5 text-base"
            >
              <ShoppingCart size={17} /> Thêm vào giỏ hàng
            </button>
            <button onClick={askAI} className="btn btn-ghost w-full py-3">
              <Bot size={15} /> Hỏi AI về sản phẩm này
            </button>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-lg text-white mb-5 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-accent-gradient inline-block" />
            Sản phẩm liên quan
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((p) => (
              <div key={p.id} onClick={() => navigate(`/customer/product/${p.id}`)}
                className="card-hover cursor-pointer p-0 overflow-hidden">
                <div className="h-24 flex items-center justify-center text-4xl bg-surface3">{productIcon(p.image_icon)}</div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-white truncate">{p.name}</p>
                  <p className="text-xs text-success font-bold mt-1">{fmtPrice(p.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
