import { create } from 'zustand'

type Theme = 'dark' | 'light'

interface ThemeStore {
  theme: Theme
  toggle: () => void
}

const saved = (localStorage.getItem('theme') as Theme) ?? 'dark'
document.documentElement.classList.toggle('dark', saved === 'dark')

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: saved,
  toggle: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    set({ theme: next })
  },
}))
