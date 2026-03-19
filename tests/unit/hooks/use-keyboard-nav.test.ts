// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useKeyboardNav } from '@renderer/hooks/use-keyboard-nav'
import React from 'react'

function createKeyEvent(key: string): React.KeyboardEvent {
  return {
    key,
    preventDefault: vi.fn()
  } as unknown as React.KeyboardEvent
}

describe('useKeyboardNav', () => {
  it('moves focus down on ArrowDown', () => {
    const onSelect = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardNav({ itemCount: 5, onSelect })
    )

    act(() => {
      result.current.handleKeyDown(createKeyEvent('ArrowDown'))
    })
    expect(result.current.focusedIndex).toBe(0)

    act(() => {
      result.current.handleKeyDown(createKeyEvent('ArrowDown'))
    })
    expect(result.current.focusedIndex).toBe(1)
  })

  it('moves focus up on ArrowUp', () => {
    const onSelect = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardNav({ itemCount: 5, onSelect })
    )

    act(() => {
      result.current.setFocusedIndex(3)
    })

    act(() => {
      result.current.handleKeyDown(createKeyEvent('ArrowUp'))
    })
    expect(result.current.focusedIndex).toBe(2)
  })

  it('does not go below 0', () => {
    const onSelect = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardNav({ itemCount: 5, onSelect })
    )

    act(() => {
      result.current.setFocusedIndex(0)
    })

    act(() => {
      result.current.handleKeyDown(createKeyEvent('ArrowUp'))
    })
    expect(result.current.focusedIndex).toBe(0)
  })

  it('does not exceed item count', () => {
    const onSelect = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardNav({ itemCount: 3, onSelect })
    )

    act(() => {
      result.current.setFocusedIndex(2)
    })

    act(() => {
      result.current.handleKeyDown(createKeyEvent('ArrowDown'))
    })
    expect(result.current.focusedIndex).toBe(2)
  })

  it('calls onSelect on Enter', () => {
    const onSelect = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardNav({ itemCount: 3, onSelect })
    )

    act(() => {
      result.current.setFocusedIndex(1)
    })

    act(() => {
      result.current.handleKeyDown(createKeyEvent('Enter'))
    })
    expect(onSelect).toHaveBeenCalledWith(1)
  })

  it('calls onDelete on Delete key', () => {
    const onSelect = vi.fn()
    const onDelete = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardNav({ itemCount: 3, onSelect, onDelete })
    )

    act(() => {
      result.current.setFocusedIndex(2)
    })

    act(() => {
      result.current.handleKeyDown(createKeyEvent('Delete'))
    })
    expect(onDelete).toHaveBeenCalledWith(2)
  })

  it('jumps to start on Home', () => {
    const onSelect = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardNav({ itemCount: 5, onSelect })
    )

    act(() => {
      result.current.setFocusedIndex(4)
    })

    act(() => {
      result.current.handleKeyDown(createKeyEvent('Home'))
    })
    expect(result.current.focusedIndex).toBe(0)
  })

  it('jumps to end on End', () => {
    const onSelect = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardNav({ itemCount: 5, onSelect })
    )

    act(() => {
      result.current.handleKeyDown(createKeyEvent('End'))
    })
    expect(result.current.focusedIndex).toBe(4)
  })

  it('supports j/k vim keys', () => {
    const onSelect = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardNav({ itemCount: 5, onSelect })
    )

    act(() => {
      result.current.handleKeyDown(createKeyEvent('j'))
    })
    expect(result.current.focusedIndex).toBe(0)

    act(() => {
      result.current.handleKeyDown(createKeyEvent('j'))
    })
    expect(result.current.focusedIndex).toBe(1)

    act(() => {
      result.current.handleKeyDown(createKeyEvent('k'))
    })
    expect(result.current.focusedIndex).toBe(0)
  })

  it('does nothing when itemCount is 0', () => {
    const onSelect = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardNav({ itemCount: 0, onSelect })
    )

    act(() => {
      result.current.handleKeyDown(createKeyEvent('ArrowDown'))
    })
    expect(result.current.focusedIndex).toBe(-1)
  })
})
