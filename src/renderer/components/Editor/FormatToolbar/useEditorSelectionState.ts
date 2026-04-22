import { useEffect, useReducer } from 'react'
import type { Editor } from '@tiptap/react'

/**
 * Subscribes to the TipTap editor's selection and transaction events and
 * triggers a re-render on every change. TipTap 2.11 does not ship
 * `useEditorState`, so this is the canonical pattern for keeping React
 * components (such as the format toolbar) in sync with editor state — most
 * importantly, the result of `editor.isActive(...)` after a selection move
 * or a mark/node toggle.
 *
 * Returns the current tick counter (consumers rarely need it, but exposing
 * it prevents the hook from being elided by aggressive optimisers).
 */
export function useEditorSelectionState(editor: Editor | null): number {
  const [tick, bump] = useReducer((n: number) => n + 1, 0)

  useEffect(() => {
    if (!editor) return

    const rerender = (): void => bump()
    editor.on('selectionUpdate', rerender)
    editor.on('transaction', rerender)

    return () => {
      editor.off('selectionUpdate', rerender)
      editor.off('transaction', rerender)
    }
  }, [editor])

  return tick
}
