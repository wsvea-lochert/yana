import { useRef, useEffect } from 'react'
import type { NoteMetadata } from '@shared/types/note'
import { formatRelativeDate } from '@shared/utils/date'
import { cn } from '@/lib/utils'

interface SidebarNoteItemProps {
  readonly note: NoteMetadata
  readonly isActive: boolean
  readonly isIndented?: boolean
  readonly onClick: () => void
}

export function SidebarNoteItem({
  note,
  isActive,
  isIndented = false,
  onClick
}: SidebarNoteItemProps) {
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isActive) {
      ref.current?.scrollIntoView({ block: 'nearest' })
    }
  }, [isActive])

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        'w-full text-left py-1 rounded-md mb-px transition-colors no-drag overflow-hidden',
        'outline-none focus-visible:outline-none',
        'hover:bg-accent/60',
        isIndented ? 'pl-7 pr-3' : 'px-3',
        isActive && 'bg-accent'
      )}
    >
      <div className="flex items-center gap-2">
        <span className="flex-1 text-sm truncate font-medium">{note.title}</span>
        <span className="flex-shrink-0 text-[11px] text-muted-foreground/60 whitespace-nowrap">
          {formatRelativeDate(note.modified)}
        </span>
      </div>
    </button>
  )
}
