import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/types'

interface CartStore {
  items: CartItem[]
  add: (item: Omit<CartItem, 'qty'>) => void
  remove: (id: number) => void
  changeQty: (id: number, delta: number) => void
  clear: () => void
  total: () => number
  count: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => {
        const items = get().items
        const ex = items.find((i) => i.id === item.id)
        if (ex) set({ items: items.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i) })
        else set({ items: [...items, { ...item, qty: 1 }] })
      },
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      changeQty: (id, delta) => {
        const items = get().items.map((i) => i.id === id ? { ...i, qty: i.qty + delta } : i).filter((i) => i.qty > 0)
        set({ items })
      },
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((s, i) => s + i.price * i.qty, 0),
      count: () => get().items.reduce((s, i) => s + i.qty, 0),
    }),
    { name: 'cart' }
  )
)
