import { forwardRef, useEffect, useRef, useState } from 'react'
import type { NoteMetadata } from '@shared/types/note'
import { formatRelativeDate } from '@shared/utils/date'
import { cn } from '@/lib/utils'
import { Kbd } from '@/components/ui/kbd'
import { useUiStore } from '../../stores/ui.store'

const isMac = navigator.platform.includes('Mac')
const modLabel = isMac ? '\u2318' : 'Ctrl'

interface SidebarNoteItemProps {
  readonly note: NoteMetadata
  readonly index?: number
  readonly isActive: boolean
  readonly isIndented?: boolean
  readonly onClick: () => void
}

export const SidebarNoteItem = forwardRef<HTMLDivElement, SidebarNoteItemProps>(
  function SidebarNoteItem({ note, index, isActive, isIndented = false, onClick, ...props }, forwardedRef) {
    const localRef = useRef<HTMLDivElement>(null)
    const modifierHeld = useUiStore((s) => s.modifierHeld)
    const [isDragging, setIsDragging] = useState(false)

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
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', note.id)
          e.dataTransfer.effectAllowed = 'move'
          setIsDragging(true)
        }}
        onDragEnd={() => setIsDragging(false)}
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
          isActive && 'bg-accent',
          isDragging && 'opacity-50'
        )}
        {...props}
      >
        <div className="flex items-center gap-2">
          <span className="flex-1 text-sm truncate font-medium">{note.title}</span>
          <span className="flex-shrink-0 flex items-center justify-end">
            {modifierHeld && index !== undefined && index < 9 ? (
              <Kbd className="text-[10px] h-auto py-0.5 animate-in fade-in duration-100">
                {modLabel} + {index + 1}
              </Kbd>
            ) : (
              <span className="text-[11px] text-muted-foreground/60 whitespace-nowrap">
                {formatRelativeDate(note.modified)}
              </span>
            )}
          </span>
        </div>
      </div>
    )
  }
)
