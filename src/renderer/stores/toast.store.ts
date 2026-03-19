import { create } from 'zustand'

type ToastType = 'error' | 'success' | 'info'

interface Toast {
  readonly id: string
  readonly message: string
  readonly type: ToastType
}

interface ToastState {
  readonly toasts: readonly Toast[]
}

interface ToastActions {
  addToast: (message: string, type: ToastType) => void
  dismissToast: (id: string) => void
}

export type ToastStore = ToastState & ToastActions

let toastCounter = 0

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (message: string, type: ToastType) => {
    const id = `toast-${++toastCounter}`
    const toast: Toast = { id, message, type }
    set({ toasts: [...get().toasts, toast] })

    setTimeout(() => {
      get().dismissToast(id)
    }, 5000)
  },

  dismissToast: (id: string) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) })
  }
}))
