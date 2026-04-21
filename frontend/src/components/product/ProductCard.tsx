import type { Product } from '@/types'
import { productIcon, fmtPrice } from '@/lib/utils'
import { useCartStore } from '@/stores/cartStore'
import { ShoppingCart, Sparkles, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Props { product: Product; recommended?: boolean }

export default function ProductCard({ product, recommended }: Props) {
  const add = useCartStore((s) => s.add)

  return (
    <div
      className={`group card-hover flex flex-col overflow-hidden p-0 ${
        recommended ? 'ring-1 ring-accent/40' : ''
      }`}
    >
      {/* Image area */}
      <Link to={`/customer/product/${product.id}`} className="block">
        <div className="product-img-area group-hover:after:opacity-100 transition-all duration-300">
          {/* Animated background glow on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: 'radial-gradient(circle at center, rgba(124,58,237,0.18) 0%, transparent 70%)' }} />
          <span className="relative z-10 text-5xl transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1 block">
            {productIcon(product.image_icon)}
          </span>
          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {recommended && (
              <span className="badge badge-accent text-[10px]">
                <Sparkles size={9} /> AI Pick
              </span>
            )}
            {(product.ai_match ?? 0) >= 95 && (
              <span className="badge badge-ok text-[10px]">
                <TrendingUp size={9} /> Top Match
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="px-4 pt-3 pb-2">
          <p className="font-semibold text-sm text-white leading-tight line-clamp-2 group-hover:text-accentLight transition-colors duration-200">
            {product.name}
          </p>
          <p className="text-xs text-gray-500 mt-1">{product.category}</p>
          <div className="flex items-center justify-between mt-2.5">
            <p className="text-success font-bold text-base">{fmtPrice(product.price)}</p>
            {product.ai_match && (
              <span className="text-[10px] text-accentLight font-semibold bg-accent/10 px-1.5 py-0.5 rounded-md">
                ✦ {product.ai_match}%
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Add to cart */}
      <div className="px-4 pb-4 mt-auto">
        <button
          id={`add-to-cart-${product.id}`}
          onClick={() => add({ id: product.id, name: product.name, price: Number(product.price), icon: product.image_icon })}
          className="btn btn-secondary w-full text-xs py-2 group-hover:border-accent/30 group-hover:text-accentLight transition-all duration-200"
        >
          <ShoppingCart size={13} /> Thêm vào giỏ
        </button>
      </div>
    </div>
  )
}
