import { useRef, useState, useEffect } from 'react'
import { Bot, X, Send, Loader2, Sparkles } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'
import api from '@/lib/api'
import { productIcon, fmtPrice } from '@/lib/utils'
import type { Product } from '@/types'

export default function ChatWidget() {
  const { open, toggle, messages, addMessage, setLoading, loading, clear } = useChatStore()
  const [input, setInput] = useState('')
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [messages, open])

  const send = async () => {
    const q = input.trim()
    if (!q || loading) return
    setInput('')
    addMessage({ id: Date.now().toString(), role: 'user', text: q })
    setLoading(true)
    try {
      const { data } = await api.post('/chat/', { query: q })
      addMessage({ id: Date.now().toString() + 'b', role: 'bot', text: data.response || 'Không có phản hồi.', products: data.products, sources: data.sources })
    } catch {
      addMessage({ id: Date.now().toString() + 'e', role: 'bot', text: 'Không thể kết nối RAG service.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={toggle}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-glow-purple transition-all hover:scale-110 hover:shadow-[0_0_30px_rgba(124,58,237,0.6)]"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
        >
          <Bot size={22} className="text-white" />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] flex flex-col rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden"
          style={{ height: 520, background: 'rgba(10,11,18,0.95)', backdropFilter: 'blur(20px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(79,70,229,0.08) 100%)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white font-display">AI Tư vấn</p>
                <p className="text-[10px] text-success flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-success rounded-full inline-block animate-pulse" /> Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={clear} className="text-[11px] text-gray-500 hover:text-gray-300 px-2 py-1 rounded-lg hover:bg-white/[0.05] transition-all">Xóa</button>
              <button onClick={toggle} className="w-7 h-7 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.08] transition-all flex items-center justify-center">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={logRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'text-white rounded-br-sm'
                    : 'bg-surface3 border border-white/[0.07] text-gray-200 rounded-bl-sm'
                }`}
                  style={m.role === 'user' ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' } : {}}>
                  {m.text}
                </div>
                {m.products && m.products.length > 0 && (
                  <div className="w-full flex flex-col gap-1.5 mt-1">
                    {m.products.map((p: Product) => (
                      <div key={p.id} className="flex items-center gap-3 bg-surface3 border border-white/[0.07] rounded-xl p-2.5 hover:border-accent/30 transition-colors cursor-pointer">
                        <span className="text-2xl">{productIcon(p.image_icon)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{p.name}</p>
                          <p className="text-xs text-success">{fmtPrice(p.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-start">
                <div className="bg-surface3 border border-white/[0.07] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 size={13} className="text-accentLight animate-spin" />
                  <span className="text-xs text-gray-500">Đang suy nghĩ...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/[0.07] flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Hỏi về sản phẩm, đơn hàng..."
              rows={1}
              className="input resize-none flex-1 text-sm py-2.5"
            />
            <button onClick={send} disabled={!input.trim() || loading}
              className="btn btn-primary px-3 self-end h-10 w-10 p-0 rounded-xl">
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
