import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const { useToastStore } = await import('@renderer/stores/toast.store')

describe('ToastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useToastStore.setState({ toasts: [] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('addToast', () => {
    it('adds a toast with correct type and message', () => {
      useToastStore.getState().addToast('Error occurred', 'error')

      const toasts = useToastStore.getState().toasts
      expect(toasts).toHaveLength(1)
      expect(toasts[0].message).toBe('Error occurred')
      expect(toasts[0].type).toBe('error')
    })

    it('adds multiple toasts', () => {
      useToastStore.getState().addToast('First', 'info')
      useToastStore.getState().addToast('Second', 'success')

      expect(useToastStore.getState().toasts).toHaveLength(2)
    })

    it('auto-dismisses after 5 seconds', () => {
      useToastStore.getState().addToast('Temp', 'info')

      expect(useToastStore.getState().toasts).toHaveLength(1)

      vi.advanceTimersByTime(5000)

      expect(useToastStore.getState().toasts).toHaveLength(0)
    })
  })

  describe('dismissToast', () => {
    it('removes a specific toast by id', () => {
      useToastStore.getState().addToast('Keep', 'info')
      useToastStore.getState().addToast('Remove', 'error')

      const toasts = useToastStore.getState().toasts
      const removeId = toasts[1].id

      useToastStore.getState().dismissToast(removeId)

      expect(useToastStore.getState().toasts).toHaveLength(1)
      expect(useToastStore.getState().toasts[0].message).toBe('Keep')
    })
  })
})
