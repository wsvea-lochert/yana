import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface NoteListContextMenuProps {
  readonly x: number
  readonly y: number
  readonly onDelete: () => void
  readonly onClose: () => void
}

export function NoteListContextMenu({ x, y, onDelete, onClose }: NoteListContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className={cn(
        'fixed z-[150] min-w-[160px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md'
      )}
      style={{ left: x, top: y }}
    >
      <button
        onClick={() => {
          onDelete()
          onClose()
        }}
        className={cn(
          'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          'text-destructive'
        )}
      >
        Delete note
      </button>
    </div>
  )
}
