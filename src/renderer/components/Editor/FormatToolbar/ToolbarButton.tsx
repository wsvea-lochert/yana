import type { MouseEvent } from 'react'
import { cn } from '@renderer/lib/utils'
import type { LucideIcon } from './format-toolbar.types'

interface ToolbarButtonProps {
  icon: LucideIcon
  label: string
  shortcut?: string
  isActive?: boolean
  disabled?: boolean
  onActivate: () => void
  /** Stable dom identifier for tests and a11y hooks. */
  dataAction: string
}

/**
 * Single format-toolbar button. Native `<button>` — not Radix Toggle — so we
 * can `preventDefault` on mousedown and avoid stealing the editor's selection
 * when the toolbar is clicked (same pattern used by the code-block copy button
 * in `CodeBlockView.tsx`).
 */
export function ToolbarButton({
  icon: Icon,
  label,
  shortcut,
  isActive = false,
  disabled = false,
  onActivate,
  dataAction
}: ToolbarButtonProps) {
  const title = shortcut ? `${label} (${shortcut})` : label

  const handleMouseDown = (event: MouseEvent<HTMLButtonElement>): void => {
    // Keep the editor selection intact — otherwise clicking the button
    // collapses the selection before the command can run on it.
    event.preventDefault()
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isActive}
      data-action={dataAction}
      data-active={isActive ? 'true' : undefined}
      title={title}
      disabled={disabled}
      onMouseDown={handleMouseDown}
      onClick={onActivate}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-full',
        'text-muted-foreground transition-colors',
        'hover:bg-muted hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[active=true]:bg-accent data-[active=true]:text-accent-foreground'
      )}
    >
      <Icon width={16} height={16} aria-hidden="true" />
    </button>
  )
}
