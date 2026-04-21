import { create } from 'zustand'
import type { ChatMessage } from '@/types'

interface ChatStore {
  open: boolean
  messages: ChatMessage[]
  loading: boolean
  toggle: () => void
  addMessage: (m: ChatMessage) => void
  setLoading: (v: boolean) => void
  clear: () => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  open: false,
  messages: [{ id: '0', role: 'bot', text: 'Xin chào! Tôi có thể tư vấn sản phẩm, so sánh giá, hoặc gợi ý bundle phù hợp cho bạn.' }],
  loading: false,
  toggle: () => set({ open: !get().open }),
  addMessage: (m) => set({ messages: [...get().messages, m] }),
  setLoading: (loading) => set({ loading }),
  clear: () => set({ messages: [{ id: '0', role: 'bot', text: 'Phiên chat mới bắt đầu.' }] }),
}))
