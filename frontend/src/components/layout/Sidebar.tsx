import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, Package, Users, BarChart2, LogOut, Sparkles, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/cn'

interface NavItem { to: string; label: string; icon: React.ReactNode }

const adminLinks: NavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { to: '/admin/products', label: 'Sản phẩm', icon: <Package size={16} /> },
  { to: '/admin/users', label: 'Người dùng', icon: <Users size={16} /> },
  { to: '/admin/analytics', label: 'Analytics', icon: <BarChart2 size={16} /> },
]

const staffLinks: NavItem[] = [
  { to: '/staff/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { to: '/staff/orders', label: 'Đơn hàng', icon: <ShoppingBag size={16} /> },
  { to: '/staff/products', label: 'Sản phẩm', icon: <Package size={16} /> },
]

export default function Sidebar({ role }: { role: 'admin' | 'staff' }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const links = role === 'admin' ? adminLinks : staffLinks

  const initials = user?.full_name?.split(' ').slice(-2).map((w: string) => w[0]).join('').toUpperCase() ?? 'U'

  const roleLabel = role === 'admin' ? 'Admin Portal' : 'Staff Portal'
  const roleBadgeColor = role === 'admin'
    ? 'from-fuchsia-500/20 to-pink-500/20 border-fuchsia-500/30 text-fuchsia-300'
    : 'from-indigo-500/20 to-blue-500/20 border-indigo-500/30 text-indigo-300'

  return (
    <aside className="w-60 shrink-0 flex flex-col h-screen sticky top-0 border-r border-white/[0.06]"
      style={{ background: 'rgba(7,8,15,0.9)', backdropFilter: 'blur(20px)' }}>

      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-accent-gradient flex items-center justify-center shadow-glow-purple shrink-0">
            <Sparkles size={14} className="text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-sm text-white leading-none">Ecommerce AI</p>
          </div>
        </div>
        <div className={cn('inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-gradient-to-r', roleBadgeColor)}>
          {role === 'admin' ? '🔑' : '🧑‍💼'} {roleLabel}
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 mx-3 mt-3 rounded-xl bg-surface3 border border-white/[0.06] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
          <p className="text-xs text-gray-500 capitalize">{role}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 flex flex-col gap-1 mt-2 overflow-y-auto">
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-3 mb-2">Menu</p>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            id={`sidebar-${l.to.split('/').pop()}`}
            className={({ isActive }) =>
              cn('nav-link group', isActive ? 'nav-link-active' : '')
            }
          >
            <span className="text-gray-500 group-[.nav-link-active]:text-accentLight transition-colors">
              {l.icon}
            </span>
            <span className="flex-1">{l.label}</span>
            <ChevronRight size={12} className="opacity-0 group-hover:opacity-40 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/[0.06]">
        <button
          id="sidebar-logout"
          onClick={() => { logout(); navigate('/login') }}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 transition-all duration-200 group"
        >
          <LogOut size={15} className="transition-transform group-hover:translate-x-0.5" />
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}
