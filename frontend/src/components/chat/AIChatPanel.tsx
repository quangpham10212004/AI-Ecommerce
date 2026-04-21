import { useRef, useState, useEffect } from 'react'
import { Sparkles, X, Send, Loader2, Bot, ArrowRight, ShoppingCart, RotateCcw } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'
import { useCartStore } from '@/stores/cartStore'
import api from '@/lib/api'
import { productIcon, fmtPrice } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import type { ChatMessage } from '@/types'

const QUICK_PROMPTS = [
  'Tư vấn tai nghe chống ồn',
  'Setup làm việc tại nhà cần gì?',
  'Laptop nào phù hợp cho lập trình?',
  'Gợi ý quà tặng dưới 5 triệu',
]

function MessageBubble({ m }: { m: ChatMessage }) {
  const add = useCartStore((s) => s.add)
  const navigate = useNavigate()

  return (
    <div className={`flex flex-col gap-3 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
      {/* Avatar + bubble */}
      <div className={`flex items-end gap-2 max-w-[88%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
        {m.role === 'bot' && (
          <div className="w-7 h-7 rounded-xl shrink-0 flex items-center justify-center mb-0.5"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
            <Sparkles size={12} className="text-white" />
          </div>
        )}
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
          m.role === 'user'
            ? 'text-white rounded-br-sm'
            : 'bg-surface2 border border-white/[0.07] text-gray-200 rounded-bl-sm'
        }`}
          style={m.role === 'user' ? { background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' } : {}}>
          {m.text}
        </div>
      </div>

      {/* Inline product cards from RAG */}
      {m.role === 'bot' && m.products && m.products.length > 0 && (
        <div className="w-full grid grid-cols-1 gap-2 pl-9">
          {m.products.map((p: any) => (
            <div key={p.product_id ?? p.id}
              onClick={() => p.product_id && navigate(`/customer/product/${p.product_id}`)}
              className="flex items-center gap-3 bg-surface3 border border-white/[0.07] rounded-xl p-3 hover:border-accent/30 cursor-pointer transition-all group">
              <div className="w-10 h-10 rounded-xl bg-surface2 flex items-center justify-center text-xl shrink-0">
                {productIcon(p.image_icon)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{p.title ?? p.name}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{p.content}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (p.product_id) add({ id: p.product_id, name: p.title ?? p.name, price: 0, icon: p.image_icon })
                }}
                className="opacity-0 group-hover:opacity-100 btn btn-ghost text-xs py-1 px-2 h-7 shrink-0 transition-opacity">
                <ShoppingCart size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AIChatPanel() {
  const { open, toggle, messages, addMessage, setLoading, loading, clear } = useChatStore()
  const [input, setInput] = useState('')
  const logRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const send = async (text?: string) => {
    const q = (text ?? input).trim()
    if (!q || loading) return
    setInput('')
    addMessage({ id: Date.now().toString(), role: 'user', text: q })
    setLoading(true)
    try {
      const { data } = await api.post('/chat/', { query: q })
      addMessage({
        id: Date.now().toString() + 'b',
        role: 'bot',
        text: data.response ?? 'Không có phản hồi.',
        products: data.retrieved_documents,
        sources: data.sources,
      })
    } catch {
      addMessage({ id: Date.now().toString() + 'e', role: 'bot', text: '⚠ Không thể kết nối AI service.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Trigger button */}
      {!open && (
        <button onClick={toggle}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-glow-purple transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(124,58,237,0.6)]"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
          <Bot size={18} className="text-white" />
          <span className="text-sm font-bold text-white">AI Tư vấn</span>
          <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
        </button>
      )}

      {/* Backdrop */}
      {open && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={toggle} />}

      {/* Panel — slides in from right */}
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-[440px] flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: 'rgba(7,8,15,0.98)', backdropFilter: 'blur(24px)', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] shrink-0"
          style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.12) 0%,rgba(79,70,229,0.06) 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-glow-purple"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm">AI Advisor</p>
              <p className="text-[10px] text-success flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse inline-block" />
                Powered by KB Graph · RAG
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={clear}
              className="w-8 h-8 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-white/[0.05] flex items-center justify-center transition-all"
              title="Xóa lịch sử">
              <RotateCcw size={13} />
            </button>
            <button onClick={toggle}
              className="w-8 h-8 rounded-xl text-gray-500 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition-all">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Messages ── */}
        <div ref={logRef} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {/* Quick prompts — only when no user messages */}
          {messages.filter(m => m.role === 'user').length === 0 && (
            <div className="flex flex-col gap-3 mb-2">
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">Gợi ý câu hỏi</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_PROMPTS.map((p) => (
                  <button key={p} onClick={() => send(p)}
                    className="text-left px-3 py-2.5 rounded-xl bg-surface3 border border-white/[0.06] text-xs text-gray-400 hover:text-white hover:border-accent/30 hover:bg-accent/5 transition-all leading-snug">
                    {p} <ArrowRight size={10} className="inline ml-1 opacity-50" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => <MessageBubble key={m.id} m={m} />)}

          {loading && (
            <div className="flex items-end gap-2">
              <div className="w-7 h-7 rounded-xl shrink-0 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                <Sparkles size={12} className="text-white" />
              </div>
              <div className="bg-surface2 border border-white/[0.07] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                <span className="flex gap-1">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 bg-accentLight rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </span>
                <span className="text-xs text-gray-500">Đang tìm kiếm knowledge graph...</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Input ── */}
        <div className="px-4 pb-5 pt-3 border-t border-white/[0.07] shrink-0">
          <div className="flex gap-2 items-end bg-surface2 border border-white/[0.08] rounded-2xl px-4 py-3 focus-within:border-accent/40 focus-within:shadow-[0_0_0_3px_rgba(124,58,237,0.1)] transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Hỏi về sản phẩm, bundle, chính sách..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-gray-100 placeholder:text-gray-600 outline-none resize-none leading-relaxed"
              style={{ maxHeight: 120 }}
            />
            <button onClick={() => send()} disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-30"
              style={{ background: input.trim() ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'rgba(255,255,255,0.05)' }}>
              {loading ? <Loader2 size={13} className="text-white animate-spin" /> : <Send size={13} className="text-white" />}
            </button>
          </div>
          <p className="text-[10px] text-gray-700 text-center mt-2">
            Dữ liệu từ Neo4j Knowledge Graph · RAG retrieval
          </p>
        </div>
      </div>
    </>
  )
}
