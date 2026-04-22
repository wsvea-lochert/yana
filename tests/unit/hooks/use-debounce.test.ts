// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '@renderer/hooks/use-debounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the initial value synchronously', () => {
    const { result } = renderHook(() => useDebounce('initial', 100))
    expect(result.current).toBe('initial')
  })

  it('delays updates by the specified ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 200),
      { initialProps: { value: 'a' } }
    )
    rerender({ value: 'b' })
    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(199)
    })
    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('b')
  })

  it('cancels pending debounce when value changes rapidly', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: '1' } }
    )
    rerender({ value: '2' })
    act(() => { vi.advanceTimersByTime(50) })
    rerender({ value: '3' })
    act(() => { vi.advanceTimersByTime(99) })
    expect(result.current).toBe('1')

    act(() => { vi.advanceTimersByTime(1) })
    expect(result.current).toBe('3')
  })

  it('supports numeric values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 50),
      { initialProps: { value: 0 } }
    )
    rerender({ value: 42 })
    act(() => { vi.advanceTimersByTime(50) })
    expect(result.current).toBe(42)
  })
})
