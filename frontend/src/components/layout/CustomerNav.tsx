import { ShoppingCart, LogOut, Bot, Search, Bell, Home, Package } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { useChatStore } from '@/stores/chatStore'
import { Sparkles } from 'lucide-react'

export default function CustomerNav() {
  const { user, logout } = useAuthStore()
  const count = useCartStore((s) => s.count())
  const toggleChat = useChatStore((s) => s.toggle)
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'text-white bg-accent/10 border border-accent/20'
        : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
    }`

  // Avatar initials
  const initials = user?.full_name?.split(' ').slice(-2).map((w: string) => w[0]).join('').toUpperCase() ?? 'U'

  return (
    <nav
      className="sticky top-0 z-50 px-6 h-16 flex items-center justify-between border-b border-white/[0.06]"
      style={{
        background: 'rgba(7,8,15,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo */}
      <Link to="/customer/home" className="flex items-center gap-2.5 group">
        <div className="w-8 h-8 rounded-xl bg-accent-gradient flex items-center justify-center shadow-glow-purple group-hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all duration-300">
          <Sparkles size={15} className="text-white" />
        </div>
        <span className="font-display font-bold text-white text-sm hidden sm:block">Ecommerce <span className="gradient-text-sm">AI</span></span>
      </Link>

      {/* Nav links */}
      <div className="hidden md:flex items-center gap-1">
        <NavLink to="/customer/home" className={navLinkClass}>
          <Home size={14} /> Trang chủ
        </NavLink>
        <NavLink to="/customer/products" className={navLinkClass}>
          <Package size={14} /> Sản phẩm
        </NavLink>
        <NavLink to="/customer/orders" className={navLinkClass}>
          Đơn hàng
        </NavLink>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* AI Chat */}
        <button
          id="nav-ai-chat"
          onClick={toggleChat}
          title="AI Assistant"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-accentLight hover:bg-accent/10 border border-transparent hover:border-accent/20 transition-all duration-200"
        >
          <Bot size={16} />
        </button>

        {/* Cart */}
        <Link
          to="/customer/cart"
          id="nav-cart"
          className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.05] border border-transparent hover:border-white/10 transition-all duration-200"
        >
          <ShoppingCart size={16} />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 bg-accent text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-glow-purple animate-pulse-glow">
              {count}
            </span>
          )}
        </Link>

        {/* Divider */}
        <div className="w-px h-6 bg-white/[0.08] mx-1" />

        {/* User */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            {initials}
          </div>
          <span className="hidden sm:block text-sm text-gray-300 font-medium max-w-[100px] truncate">{user?.full_name}</span>
        </div>

        <button
          id="nav-logout"
          onClick={handleLogout}
          className="btn btn-ghost text-xs px-3 py-2 h-8"
        >
          <LogOut size={13} />
          <span className="hidden sm:block">Đăng xuất</span>
        </button>
      </div>
    </nav>
  )
}
