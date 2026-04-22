import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { CodeBlockView } from '@renderer/components/Editor/extensions/CodeBlockView'

// A minimal stand-in for TipTap's NodeViewProps. Only `node.textContent` is
// read by the view under test. NodeViewWrapper / NodeViewContent are mocked
// below to plain DOM so we can exercise the button in isolation.
vi.mock('@tiptap/react', () => ({
  NodeViewWrapper: ({ className, children }: { className: string; children: React.ReactNode }) => (
    <div className={className}>{children}</div>
  ),
  NodeViewContent: ({ as: As = 'code' }: { as?: string }) => {
    const Tag = As as keyof JSX.IntrinsicElements
    return <Tag data-testid="code-content" />
  }
}))

function makeNode(text: string) {
  return { textContent: text } as unknown as Parameters<typeof CodeBlockView>[0]['node']
}

const clipboardWriteText = vi.fn<(text: string) => Promise<void>>()

beforeEach(() => {
  clipboardWriteText.mockReset()
  clipboardWriteText.mockResolvedValue(undefined)
  Object.assign(navigator, { clipboard: { writeText: clipboardWriteText } })
})

describe('CodeBlockView', () => {
  it('renders a copy button labeled "Copy" by default', () => {
    render(
      <CodeBlockView
        node={makeNode('console.log(1)')}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...({} as any)}
      />
    )
    const btn = screen.getByRole('button', { name: /copy code to clipboard/i })
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveTextContent(/copy/i)
  })

  it('writes the code block text to clipboard when clicked', async () => {
    render(
      <CodeBlockView
        node={makeNode('const a = 42')}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...({} as any)}
      />
    )
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => {
      expect(clipboardWriteText).toHaveBeenCalledWith('const a = 42')
    })
  })

  it('shows "Copied" feedback after a successful copy, then reverts', async () => {
    vi.useFakeTimers()
    try {
      render(
        <CodeBlockView
          node={makeNode('x')}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...({} as any)}
        />
      )
      await act(async () => {
        fireEvent.click(screen.getByRole('button'))
        // Flush the clipboard promise resolution.
        await Promise.resolve()
      })
      expect(screen.getByRole('button')).toHaveAttribute('data-copied', 'true')

      await act(async () => {
        vi.advanceTimersByTime(2000)
      })
      expect(screen.getByRole('button')).not.toHaveAttribute('data-copied')
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not throw when clipboard API rejects', async () => {
    clipboardWriteText.mockRejectedValueOnce(new Error('blocked'))
    render(
      <CodeBlockView
        node={makeNode('x')}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...({} as any)}
      />
    )
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => {
      expect(clipboardWriteText).toHaveBeenCalled()
    })
    // No "Copied" state because the write rejected.
    expect(screen.getByRole('button')).not.toHaveAttribute('data-copied')
  })

  it('prevents default on mousedown so the editor does not lose focus', () => {
    render(
      <CodeBlockView
        node={makeNode('x')}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...({} as any)}
      />
    )
    const btn = screen.getByRole('button')
    const evt = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    btn.dispatchEvent(evt)
    expect(evt.defaultPrevented).toBe(true)
  })
})
