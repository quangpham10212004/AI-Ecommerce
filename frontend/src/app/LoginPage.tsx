import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'
import { Sparkles, ShieldCheck, Users, Zap, ArrowRight, Eye, EyeOff } from 'lucide-react'

const PRESETS = {
  customer: { role: 'customer', email: 'minhanh.customer@ecommerce.local', password: '123456' },
  staff: { role: 'staff', email: 'sales.staff@ecommerce.local', password: '123456' },
  admin: { role: 'admin', email: 'admin@ecommerce.local', password: '123456' },
} as const

const ROLE_CONFIG = {
  customer: { icon: <Users size={14} />, label: 'Customer', color: 'from-violet-500 to-purple-600' },
  staff: { icon: <Zap size={14} />, label: 'Staff', color: 'from-indigo-500 to-blue-600' },
  admin: { icon: <ShieldCheck size={14} />, label: 'Admin', color: 'from-fuchsia-500 to-pink-600' },
} as const

const FEATURES = [
  { icon: '🤖', title: 'AI-Powered', desc: 'LSTM behavior analysis' },
  { icon: '💬', title: 'RAG Chatbot', desc: 'Smart customer support' },
  { icon: '⚡', title: 'Real-time', desc: 'Live order tracking' },
]

export default function LoginPage() {
  const [form, setForm] = useState({ role: 'customer', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const setUser = useAuthStore((s) => s.setUser)
  const navigate = useNavigate()

  const apply = (role: keyof typeof PRESETS) => setForm(PRESETS[role])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const { data } = await api.post('/users/login/', form)
      setUser({ ...data, role: form.role as any })
      navigate(form.role === 'customer' ? '/customer/home' : `/${form.role}/dashboard`)
    } catch {
      setError('Sai thông tin đăng nhập. Mật khẩu demo: 123456')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] relative overflow-hidden p-12">
        {/* Background orbs */}
        <div className="glow-orb w-96 h-96 bg-violet-600 -top-20 -left-20" />
        <div className="glow-orb w-72 h-72 bg-indigo-600 bottom-20 right-10" />
        <div className="glow-orb w-48 h-48 bg-purple-400 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-accent-gradient flex items-center justify-center shadow-glow-purple">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">Ecommerce AI</span>
          </div>
        </div>

        {/* Main headline */}
        <div className="relative z-10 animate-slide-up">
          <h1 className="font-display font-extrabold text-5xl leading-tight text-white mb-4">
            Shopping<br />
            <span className="gradient-text">Powered by AI</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-md">
            Nền tảng thương mại điện tử thông minh với LSTM behaviour analysis và RAG chatbot hỗ trợ 24/7.
          </p>

          <div className="flex flex-col gap-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-center gap-4 card-glass py-3 px-4 w-fit">
                <span className="text-xl">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-xs text-gray-600">© 2025 Ecommerce AI · Built with Django + React</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm animate-slide-up">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-accent-gradient flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg text-white">Ecommerce AI</span>
          </div>

          <h2 className="font-display font-bold text-2xl text-white mb-1">Đăng nhập</h2>
          <p className="text-sm text-gray-500 mb-7">Chọn role và đăng nhập để tiếp tục</p>

          {/* Role tabs */}
          <div className="flex gap-2 p-1 bg-surface2 rounded-xl mb-6 border border-white/[0.06]">
            {(['customer', 'staff', 'admin'] as const).map((r) => (
              <button
                key={r}
                id={`role-tab-${r}`}
                onClick={() => apply(r)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  form.role === r
                    ? 'bg-accent text-white shadow-glow-purple'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {ROLE_CONFIG[r].icon}
                {ROLE_CONFIG[r].label}
              </button>
            ))}
          </div>

          {/* Form card */}
          <div className="card">
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wider">Email</label>
                <input
                  id="login-email"
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="user@ecommerce.local"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wider">Mật khẩu</label>
                <div className="relative">
                  <input
                    id="login-password"
                    className="input pr-10"
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-3 py-2.5">
                  <span className="mt-0.5 shrink-0">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full mt-1 h-11 text-sm"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang đăng nhập...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Đăng nhập <ArrowRight size={15} />
                  </span>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-600 mt-5">
            Mật khẩu demo tất cả role:{' '}
            <code className="text-accentLight font-semibold bg-accent/10 px-1.5 py-0.5 rounded">123456</code>
          </p>
        </div>
      </div>
    </div>
  )
}
