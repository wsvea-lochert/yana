import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockApi } from '../../mocks/api.mock'

const mockApi = createMockApi()

vi.stubGlobal('window', {
  api: mockApi,
  matchMedia: vi.fn().mockReturnValue({ matches: false })
})
vi.stubGlobal('document', {
  documentElement: {
    classList: {
      toggle: vi.fn()
    }
  }
})

const { useUiStore } = await import('@renderer/stores/ui.store')

describe('UiStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useUiStore.setState({
      sidebarVisible: true,
      theme: 'light',
      focusMode: false,
      commandPaletteOpen: false,
      sidebarView: 'all',
      sortBy: 'modified',
      sortDirection: 'desc',
      modifierHeld: false
    })
  })

  describe('initTheme', () => {
    it('reads theme from config and applies it', async () => {
      vi.mocked(mockApi.config.get).mockResolvedValueOnce('dark')

      await useUiStore.getState().initTheme()

      expect(mockApi.config.get).toHaveBeenCalledWith('theme')
      expect(useUiStore.getState().theme).toBe('dark')
      expect(document.documentElement.classList.toggle).toHaveBeenCalledWith('dark', true)
    })

    it('defaults to light when config returns null', async () => {
      vi.mocked(mockApi.config.get).mockResolvedValueOnce(null)

      await useUiStore.getState().initTheme()

      expect(useUiStore.getState().theme).toBe('light')
      expect(document.documentElement.classList.toggle).toHaveBeenCalledWith('dark', false)
    })

    it('defaults to light on invalid value', async () => {
      vi.mocked(mockApi.config.get).mockResolvedValueOnce('invalid')

      await useUiStore.getState().initTheme()

      expect(useUiStore.getState().theme).toBe('light')
    })

    it('defaults to light on config error', async () => {
      vi.mocked(mockApi.config.get).mockRejectedValueOnce(new Error('fail'))

      await useUiStore.getState().initTheme()

      expect(useUiStore.getState().theme).toBe('light')
    })
  })

  describe('setTheme', () => {
    it('persists theme via config.set', () => {
      useUiStore.getState().setTheme('dark')

      expect(useUiStore.getState().theme).toBe('dark')
      expect(mockApi.config.set).toHaveBeenCalledWith('theme', 'dark')
      expect(document.documentElement.classList.toggle).toHaveBeenCalledWith('dark', true)
    })
  })

  describe('toggleTheme', () => {
    it('toggles from light to dark and persists', () => {
      useUiStore.getState().toggleTheme()

      expect(useUiStore.getState().theme).toBe('dark')
      expect(mockApi.config.set).toHaveBeenCalledWith('theme', 'dark')
    })

    it('toggles from dark to light and persists', () => {
      useUiStore.setState({ theme: 'dark' })

      useUiStore.getState().toggleTheme()

      expect(useUiStore.getState().theme).toBe('light')
      expect(mockApi.config.set).toHaveBeenCalledWith('theme', 'light')
    })
  })

  describe('sidebarView', () => {
    it('sets sidebar view', () => {
      useUiStore.getState().setSidebarView('tags')
      expect(useUiStore.getState().sidebarView).toBe('tags')
    })
  })

  describe('sortBy', () => {
    it('sets sort field', () => {
      useUiStore.getState().setSortBy('title')
      expect(useUiStore.getState().sortBy).toBe('title')
    })
  })

  describe('toggleSortDirection', () => {
    it('toggles from desc to asc', () => {
      useUiStore.getState().toggleSortDirection()
      expect(useUiStore.getState().sortDirection).toBe('asc')
    })

    it('toggles from asc to desc', () => {
      useUiStore.setState({ sortDirection: 'asc' })
      useUiStore.getState().toggleSortDirection()
      expect(useUiStore.getState().sortDirection).toBe('desc')
    })
  })
})
