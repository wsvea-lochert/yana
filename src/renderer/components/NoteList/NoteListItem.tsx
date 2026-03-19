import { useEffect, useRef } from 'react'
import type { NoteMetadata } from '@shared/types/note'
import { formatRelativeDate } from '@shared/utils/date'
import { cn } from '@/lib/utils'
import { Kbd } from '@/components/ui/kbd'
import { useUiStore } from '../../stores/ui.store'

const isMac = navigator.platform.includes('Mac')
const modLabel = isMac ? '\u2318' : 'Ctrl'

interface NoteListItemProps {
  readonly note: NoteMetadata
  readonly index: number
  readonly isActive: boolean
  readonly isFocused?: boolean
  readonly onClick: () => void
}

export function NoteListItem({
  note,
  index,
  isActive,
  isFocused = false,
  onClick
}: NoteListItemProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const modifierHeld = useUiStore((s) => s.modifierHeld)

  useEffect(() => {
    if (isFocused) {
      ref.current?.scrollIntoView({ block: 'nearest' })
    }
  }, [isFocused])

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-1.5 rounded-md mb-px transition-colors no-drag overflow-hidden',
        'outline-none focus-visible:outline-none',
        'hover:bg-accent/60',
        isActive && 'bg-accent',
        isFocused && !isActive && 'bg-accent/30'
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-snug truncate">
            {note.title}
          </h3>
          {note.excerpt && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 leading-relaxed">
              {note.excerpt}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 w-[60px] flex items-center justify-end gap-1.5">
          {modifierHeld && index < 9 ? (
            <Kbd className="text-[10px] h-auto py-0.5 animate-in fade-in duration-100">
              {modLabel} + {index + 1}
            </Kbd>
          ) : (
            <span className="text-[11px] text-muted-foreground/60 whitespace-nowrap">
              {formatRelativeDate(note.modified)}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
