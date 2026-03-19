import { useToastStore } from '../../stores/toast.store'
import { cn } from '@/lib/utils'

const typeStyles = {
  error: 'bg-destructive/10 border-destructive/20 text-destructive',
  success: 'bg-primary/10 border-primary/20 text-primary',
  info: 'bg-secondary border-border text-secondary-foreground'
} as const

export function Toast() {
  const toasts = useToastStore((s) => s.toasts)
  const dismissToast = useToastStore((s) => s.dismissToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[300] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-start gap-2 px-4 py-3 rounded-lg border shadow-lg',
            'animate-[slideIn_200ms_ease-out]',
            typeStyles[toast.type]
          )}
        >
          <p className="text-sm flex-1">{toast.message}</p>
          <button
            onClick={() => dismissToast(toast.id)}
            className="text-current opacity-50 hover:opacity-100 transition-opacity flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(16px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
