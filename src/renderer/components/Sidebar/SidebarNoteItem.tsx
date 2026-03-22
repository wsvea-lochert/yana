import { forwardRef, useEffect, useRef } from 'react'
import type { NoteMetadata } from '@shared/types/note'
import { formatRelativeDate } from '@shared/utils/date'
import { cn } from '@/lib/utils'

interface SidebarNoteItemProps {
  readonly note: NoteMetadata
  readonly isActive: boolean
  readonly isIndented?: boolean
  readonly onClick: () => void
}

export const SidebarNoteItem = forwardRef<HTMLDivElement, SidebarNoteItemProps>(
  function SidebarNoteItem({ note, isActive, isIndented = false, onClick, ...props }, forwardedRef) {
    const localRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (isActive) {
        localRef.current?.scrollIntoView({ block: 'nearest' })
      }
    }, [isActive])

    return (
      <div
        ref={(node) => {
          (localRef as React.MutableRefObject<HTMLDivElement | null>).current = node
          if (typeof forwardedRef === 'function') forwardedRef(node)
          else if (forwardedRef) forwardedRef.current = node
        }}
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
        className={cn(
          'w-full text-left py-1 rounded-md mb-px transition-colors no-drag overflow-hidden cursor-default',
          'outline-none focus-visible:outline-none',
          'hover:bg-accent/60',
          isIndented ? 'pl-7 pr-3' : 'px-3',
          isActive && 'bg-accent'
        )}
        {...props}
      >
        <div className="flex items-center gap-2">
          <span className="flex-1 text-sm truncate font-medium">{note.title}</span>
          <span className="flex-shrink-0 text-[11px] text-muted-foreground/60 whitespace-nowrap">
            {formatRelativeDate(note.modified)}
          </span>
        </div>
      </div>
    )
  }
)
