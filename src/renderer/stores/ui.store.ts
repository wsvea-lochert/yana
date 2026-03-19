import { create } from 'zustand'

type Theme = 'light' | 'dark'
type SidebarView = 'all' | 'tags' | 'settings'
type SortBy = 'modified' | 'created' | 'title'
type SortDirection = 'asc' | 'desc'

interface UiState {
  readonly sidebarVisible: boolean
  readonly theme: Theme
  readonly focusMode: boolean
  readonly commandPaletteOpen: boolean
  readonly sidebarView: SidebarView
  readonly sortBy: SortBy
  readonly sortDirection: SortDirection
  readonly modifierHeld: boolean
}

interface UiActions {
  toggleSidebar: () => void
  initTheme: () => Promise<void>
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  toggleFocusMode: () => void
  setCommandPaletteOpen: (open: boolean) => void
  setSidebarView: (view: SidebarView) => void
  setSortBy: (sortBy: SortBy) => void
  toggleSortDirection: () => void
  setModifierHeld: (held: boolean) => void
}

export type UiStore = UiState & UiActions

function isValidTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

export const useUiStore = create<UiStore>((set, get) => ({
  sidebarVisible: true,
  theme: 'light',
  focusMode: false,
  commandPaletteOpen: false,
  sidebarView: 'all',
  sortBy: 'modified',
  sortDirection: 'desc',
  modifierHeld: false,

  toggleSidebar: () => set({ sidebarVisible: !get().sidebarVisible }),

  initTheme: async () => {
    try {
      const stored = await window.api.config.get('theme')
      if (isValidTheme(stored)) {
        get().setTheme(stored)
      } else {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        get().setTheme(systemDark ? 'dark' : 'light')
      }
    } catch {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      get().setTheme(systemDark ? 'dark' : 'light')
    }
  },

  setTheme: (theme: Theme) => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    set({ theme })
    window.api.config.set('theme', theme).catch(() => {})
  },

  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light'
    get().setTheme(next)
  },

  toggleFocusMode: () => set({ focusMode: !get().focusMode }),

  setCommandPaletteOpen: (open: boolean) => set({ commandPaletteOpen: open }),

  setSidebarView: (view: SidebarView) => set({ sidebarView: view }),

  setSortBy: (sortBy: SortBy) => set({ sortBy }),

  toggleSortDirection: () =>
    set({ sortDirection: get().sortDirection === 'asc' ? 'desc' : 'asc' }),

  setModifierHeld: (held: boolean) => set({ modifierHeld: held })
}))
