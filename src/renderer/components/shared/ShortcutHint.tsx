import { useUiStore } from '../../stores/ui.store'
import { cn } from '@/lib/utils'
import { Kbd } from '@/components/ui/kbd'

const isMac = navigator.platform.includes('Mac')

interface ShortcutHintProps {
  readonly shortcut: string
  readonly className?: string
}

export function ShortcutHint({ shortcut, className }: ShortcutHintProps) {
  const modifierHeld = useUiStore((s) => s.modifierHeld)

  if (!modifierHeld) return null

  const display = isMac
    ? shortcut.replace('Mod+', '\u2318 + ')
    : shortcut.replace('Mod+', 'Ctrl + ')

  return (
    <Kbd
      className={cn(
        'ml-auto text-[10px] h-auto py-0.5 animate-in fade-in duration-100',
        className
      )}
    >
      {display}
    </Kbd>
  )
}
