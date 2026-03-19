import { cn } from '@/lib/utils'

export function LoadingBar() {
  return (
    <div className="h-0.5 w-full overflow-hidden">
      <div className={cn('h-full bg-primary animate-[loadingSlide_1.2s_ease-in-out_infinite] w-1/3')} />
      <style>{`
        @keyframes loadingSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  )
}
