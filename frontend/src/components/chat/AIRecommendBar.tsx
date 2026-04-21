import { useEffect, useState } from 'react'
import { Sparkles, Loader2, ShoppingCart } from 'lucide-react'
import api from '@/lib/api'
import { productIcon, fmtPrice } from '@/lib/utils'
import { useCartStore } from '@/stores/cartStore'
import { useNavigate } from 'react-router-dom'

interface RagProduct {
  title: string
  content: string
  score: number
  product_id?: number
}

interface Props {
  query: string        // search term or cart context
  label?: string
}

export default function AIRecommendBar({ query, label }: Props) {
  const [docs, setDocs] = useState<RagProduct[]>([])
  const [loading, setLoading] = useState(false)
  const add = useCartStore((s) => s.add)
  const navigate = useNavigate()

  useEffect(() => {
    if (!query.trim()) { setDocs([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const { data } = await api.post('/chat/', { query })
        setDocs(data.retrieved_documents ?? [])
      } catch {
        setDocs([])
      } finally {
        setLoading(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [query])

  if (!query.trim() && !loading) return null

  return (
    <div className="rounded-2xl border border-accent/20 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(79,70,229,0.04) 100%)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
          <Sparkles size={11} className="text-white" />
        </div>
        <p className="text-xs font-bold text-accentLight uppercase tracking-wider">
          {label ?? 'AI gợi ý từ Knowledge Graph'}
        </p>
        {loading && <Loader2 size={12} className="text-accentLight animate-spin ml-auto" />}
      </div>

      {/* Results */}
      {!loading && docs.length === 0 && (
        <p className="text-xs text-gray-600 px-4 py-3">Không tìm thấy gợi ý phù hợp.</p>
      )}

      <div className="flex flex-col divide-y divide-white/[0.04]">
        {docs.map((doc, i) => (
          <div key={i}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors group cursor-pointer"
            onClick={() => doc.product_id && navigate(`/customer/product/${doc.product_id}`)}>
            <div className="w-10 h-10 rounded-xl bg-surface3 border border-white/[0.06] flex items-center justify-center text-xl shrink-0">
              {productIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{doc.title}</p>
              <p className="text-xs text-gray-500 truncate mt-0.5">{doc.content}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {doc.product_id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    add({ id: doc.product_id!, name: doc.title, price: 0, icon: undefined })
                  }}
                  className="btn btn-ghost text-xs py-1 px-2 h-7">
                  <ShoppingCart size={11} /> Thêm
                </button>
              )}
            </div>
            <span className="text-[10px] text-gray-600 shrink-0">
              {Math.round(doc.score * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
