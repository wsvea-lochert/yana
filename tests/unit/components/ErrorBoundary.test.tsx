import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '@renderer/components/shared/ErrorBoundary'

function Thrower({ message }: { message: string }): never {
  throw new Error(message)
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>safe content</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('safe content')).toBeInTheDocument()
  })

  it('catches render errors and shows default fallback', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Thrower message="boom" />
      </ErrorBoundary>
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('boom')).toBeInTheDocument()
    err.mockRestore()
  })

  it('uses custom fallback when provided', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary fallback={(error) => <div>custom: {error.message}</div>}>
        <Thrower message="kaboom" />
      </ErrorBoundary>
    )
    expect(screen.getByText('custom: kaboom')).toBeInTheDocument()
    err.mockRestore()
  })

  it('reload button is rendered in default fallback', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Thrower message="boom" />
      </ErrorBoundary>
    )
    const btn = screen.getByRole('button', { name: /reload window/i })
    expect(btn).toBeInTheDocument()
    // Don't actually click — jsdom doesn't implement window.location.reload
    fireEvent.click(btn)
    err.mockRestore()
  })
})
