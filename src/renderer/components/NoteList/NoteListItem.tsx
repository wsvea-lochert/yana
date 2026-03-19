import { useEffect, useRef } from 'react'
import type { NoteMetadata } from '@shared/types/note'
import { formatRelativeDate } from '@shared/utils/date'
import { cn } from '@/lib/utils'
import { Kbd } from '@/components/ui/kbd'
import { useUiStore } from '../../stores/ui.store'

interface NoteListItemProps {
  readonly note: NoteMetadata
  readonly index: number
  readonly isActive: boolean
  readonly isFocused?: boolean
  readonly onClick: () => void
  readonly onContextMenu?: (e: React.MouseEvent) => void
}

export function NoteListItem({
  note,
  index,
  isActive,
  isFocused = false,
  onClick,
  onContextMenu
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
      onContextMenu={onContextMenu}
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
        <div className="flex-shrink-0 flex items-center gap-1.5">
          {modifierHeld && index < 9 ? (
            <Kbd className="text-[10px] animate-in fade-in duration-100">
              {index + 1}
            </Kbd>
          ) : (
            <span className="text-[11px] text-muted-foreground/60">
              {formatRelativeDate(note.modified)}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
