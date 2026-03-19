import { useState, useCallback } from 'react'

interface KeyboardNavOptions {
  readonly itemCount: number
  readonly onSelect: (index: number) => void
  readonly onDelete?: (index: number) => void
}

interface KeyboardNavResult {
  readonly focusedIndex: number
  readonly setFocusedIndex: (index: number) => void
  readonly handleKeyDown: (e: React.KeyboardEvent) => void
}

export function useKeyboardNav({
  itemCount,
  onSelect,
  onDelete
}: KeyboardNavOptions): KeyboardNavResult {
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (itemCount === 0) return

      switch (e.key) {
        case 'ArrowDown':
        case 'j': {
          e.preventDefault()
          setFocusedIndex((prev) => {
            const next = prev < itemCount - 1 ? prev + 1 : prev
            return next
          })
          break
        }
        case 'ArrowUp':
        case 'k': {
          e.preventDefault()
          setFocusedIndex((prev) => {
            const next = prev > 0 ? prev - 1 : 0
            return next
          })
          break
        }
        case 'Enter': {
          e.preventDefault()
          if (focusedIndex >= 0 && focusedIndex < itemCount) {
            onSelect(focusedIndex)
          }
          break
        }
        case 'Delete':
        case 'Backspace': {
          if (onDelete && focusedIndex >= 0 && focusedIndex < itemCount) {
            e.preventDefault()
            onDelete(focusedIndex)
          }
          break
        }
        case 'Home': {
          e.preventDefault()
          setFocusedIndex(0)
          break
        }
        case 'End': {
          e.preventDefault()
          setFocusedIndex(itemCount - 1)
          break
        }
      }
    },
    [itemCount, focusedIndex, onSelect, onDelete]
  )

  return { focusedIndex, setFocusedIndex, handleKeyDown }
}
