import { useState, useDeferredValue } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import api from '@/lib/api'
import ProductCard from '@/components/product/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import type { Product } from '@/types'

const CATEGORIES = ['Tất cả', 'Audio', 'Laptop', 'Monitor', 'Accessories', 'Storage']

const SORT_OPTIONS = [
  { value: 'default', label: 'Mặc định' },
  { value: 'price-asc', label: 'Giá tăng dần' },
  { value: 'price-desc', label: 'Giá giảm dần' },
  { value: 'ai-match', label: 'AI Match' },
]

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('Tất cả')
  const [sort, setSort] = useState('default')
  const deferred = useDeferredValue(search)

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products/').then((r) => r.data),
  })

  let filtered = products.filter((p) => {
    const matchCat = cat === 'Tất cả' || p.category === cat
    const matchSearch = !deferred || p.name.toLowerCase().includes(deferred.toLowerCase()) || p.category.toLowerCase().includes(deferred.toLowerCase())
    return matchCat && matchSearch
  })

  if (sort === 'price-asc') filtered = [...filtered].sort((a, b) => Number(a.price) - Number(b.price))
  if (sort === 'price-desc') filtered = [...filtered].sort((a, b) => Number(b.price) - Number(a.price))
  if (sort === 'ai-match') filtered = [...filtered].sort((a, b) => (b.ai_match ?? 0) - (a.ai_match ?? 0))

  return (
    <div className="px-6 py-8 flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl text-white mb-1">Sản phẩm</h1>
        <p className="text-sm text-gray-500">Khám phá toàn bộ danh mục sản phẩm công nghệ</p>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            id="product-search"
            className="input pl-9"
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-gray-500 shrink-0" />
          <select
            id="product-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input text-sm py-2 w-40 cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            id={`cat-${c}`}
            onClick={() => setCat(c)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
              cat === c
                ? 'bg-accent text-white shadow-glow-purple'
                : 'bg-surface3 text-gray-400 hover:text-white border border-white/[0.07] hover:border-accent/30'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Result count */}
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
        <p className="text-xs text-gray-500 font-medium">{isLoading ? 'Đang tải...' : `${filtered.length} sản phẩm`}</p>
      </div>

      {/* Grid */}
      {!isLoading && filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <span className="text-5xl">🔍</span>
          <p className="text-white font-semibold">Không tìm thấy sản phẩm</p>
          <p className="text-sm text-gray-500">Thử thay đổi từ khóa hoặc danh mục</p>
          <button onClick={() => { setSearch(''); setCat('Tất cả') }} className="btn btn-secondary mt-2">
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : filtered.map((p) => <ProductCard key={p.id} product={p} />)
          }
        </div>
      )}
    </div>
  )
}
