import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import ProductCard from '@/components/product/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import type { Product } from '@/types'
import { Sparkles, Flame, ArrowRight, Zap, Shield, HeadphonesIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

const PERKS = [
  { icon: <Zap size={18} className="text-warning" />, title: 'Giao hàng nhanh', desc: 'Trong vòng 24h' },
  { icon: <Shield size={18} className="text-success" />, title: 'Bảo hành chính hãng', desc: '12-24 tháng' },
  { icon: <HeadphonesIcon size={18} className="text-accentLight" />, title: 'Hỗ trợ 24/7', desc: 'AI Chatbot & Live chat' },
]

export default function CustomerHome() {
  const { user } = useAuthStore()
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products/').then((r) => r.data),
  })

  const recommended = products?.filter((p) => (p.ai_match ?? 0) >= 90) ?? []
  const trending = products?.slice(0, 8) ?? []
  const firstName = user?.full_name?.split(' ').pop() ?? 'bạn'

  return (
    <div className="flex flex-col gap-10 pb-16 animate-fade-in">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(79,70,229,0.08) 40%, transparent 70%)',
          }}
        />
        <div className="glow-orb w-80 h-80 bg-violet-600 opacity-10 -top-20 -right-10" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 px-6 py-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-semibold text-accentLight mb-4">
              <Sparkles size={11} /> LSTM Behavior AI · Personalized for you
            </div>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-white leading-tight mb-3">
              Chào mừng trở lại,{' '}
              <span className="gradient-text">{firstName}</span> 👋
            </h1>
            <p className="text-gray-400 text-lg mb-8 max-w-lg">
              Khám phá hàng nghìn sản phẩm công nghệ được AI gợi ý riêng cho bạn.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/customer/products" className="btn btn-primary px-6 py-3 text-sm">
                Mua sắm ngay <ArrowRight size={15} />
              </Link>
              <Link to="/customer/orders" className="btn btn-secondary px-6 py-3 text-sm">
                Đơn hàng của tôi
              </Link>
            </div>
          </div>
        </div>

        {/* Perks bar */}
        <div className="relative z-10 border-t border-white/[0.06] px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PERKS.map((p) => (
            <div key={p.title} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface3 border border-white/[0.08] flex items-center justify-center shrink-0">
                {p.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{p.title}</p>
                <p className="text-xs text-gray-500">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI Recommendations ── */}
      {(isLoading || recommended.length > 0) && (
        <section className="px-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title text-lg">
              <Sparkles size={16} className="text-accentLight" /> AI Gợi ý cho bạn
            </h2>
            <Link to="/customer/products" className="text-xs text-gray-500 hover:text-accentLight transition-colors flex items-center gap-1">
              Xem tất cả <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : recommended.slice(0, 5).map((p) => <ProductCard key={p.id} product={p} recommended />)
            }
          </div>
        </section>
      )}

      {/* ── Trending ── */}
      <section className="px-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title text-lg">
            <Flame size={16} className="text-warning" /> Sản phẩm nổi bật
          </h2>
          <Link to="/customer/products" className="text-xs text-gray-500 hover:text-accentLight transition-colors flex items-center gap-1">
            Xem tất cả <ArrowRight size={12} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : trending.map((p) => <ProductCard key={p.id} product={p} />)
          }
        </div>
      </section>

      {/* ── Banner CTA ── */}
      <section className="mx-6">
        <div className="relative overflow-hidden rounded-2xl border border-accent/20 px-8 py-10"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(79,70,229,0.1) 50%, rgba(14,165,233,0.08) 100%)' }}>
          <div className="glow-orb w-64 h-64 bg-violet-600 opacity-20 -right-10 -top-10" />
          <div className="relative z-10 max-w-md">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-xs font-semibold text-accentLight mb-3">
              <Sparkles size={10} /> Powered by AI
            </div>
            <h3 className="font-display font-bold text-2xl text-white mb-2">
              Thử AI Chatbot ngay!
            </h3>
            <p className="text-gray-400 text-sm mb-5">
              Hỏi bất cứ điều gì về sản phẩm, đơn hàng hoặc chính sách — AI trả lời 24/7.
            </p>
            <button className="btn btn-primary px-5">
              Chat với AI <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
