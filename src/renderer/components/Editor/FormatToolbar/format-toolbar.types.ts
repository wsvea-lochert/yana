import type { ComponentType, SVGProps } from 'react'
import type { Editor } from '@tiptap/react'

export type LucideIcon = ComponentType<SVGProps<SVGSVGElement>>

/**
 * Descriptor for a single toolbar action. `isActive` is optional (some actions
 * — e.g. inserting a horizontal rule — have no persistent active state).
 */
export interface ToolbarAction {
  /** Stable identifier used as the React key and test hook. */
  id: string
  /** Short human label — rendered in `aria-label` and the `title` prefix. */
  label: string
  /** Keyboard shortcut hint appended to the `title` attribute (e.g. "⌘B"). */
  shortcut?: string
  /** Lucide icon component rendered at 16x16. */
  icon: LucideIcon
  /** Returns whether this action is currently active given the editor state. */
  isActive?: (editor: Editor) => boolean
  /** Command invoked on click. Must call `.focus()` to restore editor focus. */
  run: (editor: Editor) => void
}

export interface ToolbarGroup {
  /** Stable group id — used as the React key. */
  id: string
  actions: ToolbarAction[]
}
