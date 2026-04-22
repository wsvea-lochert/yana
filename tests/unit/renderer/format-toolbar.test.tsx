import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import type { Editor } from '@tiptap/react'
import { FormatToolbar } from '@renderer/components/Editor/FormatToolbar/FormatToolbar'
import { sanitizeLinkUrl } from '@renderer/components/Editor/FormatToolbar/LinkButton'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

type CommandName =
  | 'toggleBold'
  | 'toggleItalic'
  | 'toggleUnderline'
  | 'toggleStrike'
  | 'toggleCode'
  | 'toggleHeading'
  | 'toggleBulletList'
  | 'toggleOrderedList'
  | 'toggleTaskList'
  | 'toggleBlockquote'
  | 'toggleCodeBlock'
  | 'setHorizontalRule'
  | 'setLink'
  | 'unsetLink'
  | 'extendMarkRange'
  | 'focus'

interface MockChain {
  focus: ReturnType<typeof vi.fn>
  toggleBold: ReturnType<typeof vi.fn>
  toggleItalic: ReturnType<typeof vi.fn>
  toggleUnderline: ReturnType<typeof vi.fn>
  toggleStrike: ReturnType<typeof vi.fn>
  toggleCode: ReturnType<typeof vi.fn>
  toggleHeading: ReturnType<typeof vi.fn>
  toggleBulletList: ReturnType<typeof vi.fn>
  toggleOrderedList: ReturnType<typeof vi.fn>
  toggleTaskList: ReturnType<typeof vi.fn>
  toggleBlockquote: ReturnType<typeof vi.fn>
  toggleCodeBlock: ReturnType<typeof vi.fn>
  setHorizontalRule: ReturnType<typeof vi.fn>
  setLink: ReturnType<typeof vi.fn>
  unsetLink: ReturnType<typeof vi.fn>
  extendMarkRange: ReturnType<typeof vi.fn>
  run: ReturnType<typeof vi.fn>
  callOrder: CommandName[]
}

function createMockEditor(options: {
  isActive?: (name: string, attrs?: Record<string, unknown>) => boolean
  linkHref?: string
} = {}): { editor: Editor; chain: MockChain; emit: (event: 'selectionUpdate' | 'transaction') => void } {
  const listeners: Record<string, Array<() => void>> = {
    selectionUpdate: [],
    transaction: []
  }

  const callOrder: CommandName[] = []
  const track = <T,>(name: CommandName, returns: T) => {
    return vi.fn((..._args: unknown[]) => {
      callOrder.push(name)
      return returns
    })
  }

  // Build the chain so each command returns the chain, and `run()` is terminal.
  const chain: MockChain = {} as MockChain
  const ret = (): MockChain => chain
  chain.focus = track('focus', chain as unknown)
  chain.focus.mockImplementation(() => {
    callOrder.push('focus')
    return chain
  })
  // Re-bind each command with the "return chain" pattern for easy chaining.
  const bind = (name: CommandName): ReturnType<typeof vi.fn> =>
    vi.fn((..._args: unknown[]) => {
      callOrder.push(name)
      return chain
    })
  chain.focus = bind('focus') as unknown as MockChain['focus']
  chain.toggleBold = bind('toggleBold')
  chain.toggleItalic = bind('toggleItalic')
  chain.toggleUnderline = bind('toggleUnderline')
  chain.toggleStrike = bind('toggleStrike')
  chain.toggleCode = bind('toggleCode')
  chain.toggleHeading = bind('toggleHeading')
  chain.toggleBulletList = bind('toggleBulletList')
  chain.toggleOrderedList = bind('toggleOrderedList')
  chain.toggleTaskList = bind('toggleTaskList')
  chain.toggleBlockquote = bind('toggleBlockquote')
  chain.toggleCodeBlock = bind('toggleCodeBlock')
  chain.setHorizontalRule = bind('setHorizontalRule')
  chain.setLink = bind('setLink')
  chain.unsetLink = bind('unsetLink')
  chain.extendMarkRange = bind('extendMarkRange')
  chain.run = vi.fn(() => ret())
  chain.callOrder = callOrder

  const editor = {
    isActive: vi.fn((name: string, attrs?: Record<string, unknown>) =>
      options.isActive ? options.isActive(name, attrs) : false
    ),
    chain: vi.fn(() => chain),
    getAttributes: vi.fn((name: string) =>
      name === 'link' ? { href: options.linkHref ?? '' } : {}
    ),
    on: vi.fn((event: string, cb: () => void) => {
      if (listeners[event]) listeners[event].push(cb)
    }),
    off: vi.fn((event: string, cb: () => void) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((fn) => fn !== cb)
      }
    })
  } as unknown as Editor

  return {
    editor,
    chain,
    emit: (event) => {
      for (const cb of listeners[event]) cb()
    }
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// URL sanitizer
// ---------------------------------------------------------------------------

describe('sanitizeLinkUrl', () => {
  it('accepts http(s)/mailto/tel/anchor/absolute-path as-is', () => {
    expect(sanitizeLinkUrl('https://example.com')).toBe('https://example.com')
    expect(sanitizeLinkUrl('http://foo.test')).toBe('http://foo.test')
    expect(sanitizeLinkUrl('mailto:a@b.com')).toBe('mailto:a@b.com')
    expect(sanitizeLinkUrl('tel:+123')).toBe('tel:+123')
    expect(sanitizeLinkUrl('#anchor')).toBe('#anchor')
    expect(sanitizeLinkUrl('/path/to/note')).toBe('/path/to/note')
  })

  it('prefixes https:// when no scheme is present', () => {
    expect(sanitizeLinkUrl('example.com')).toBe('https://example.com')
    expect(sanitizeLinkUrl('  foo.bar  ')).toBe('https://foo.bar')
  })

  it('rejects empty and xss-y inputs', () => {
    expect(sanitizeLinkUrl('')).toBeNull()
    expect(sanitizeLinkUrl('   ')).toBeNull()
    expect(sanitizeLinkUrl('javascript:alert(1)')).toBeNull()
    expect(sanitizeLinkUrl('  JavaScript:alert(1)')).toBeNull()
    expect(sanitizeLinkUrl('data:text/html,hi')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// FormatToolbar
// ---------------------------------------------------------------------------

describe('FormatToolbar', () => {
  it('renders nothing when editor is null', () => {
    const { container } = render(<FormatToolbar editor={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders all 14 format buttons', () => {
    const { editor } = createMockEditor()
    render(<FormatToolbar editor={editor} />)

    const expectedActions = [
      'bold',
      'italic',
      'underline',
      'strike',
      'code',
      'h1',
      'h2',
      'h3',
      'bulletList',
      'orderedList',
      'taskList',
      'blockquote',
      'codeBlock',
      'link',
      'horizontalRule'
    ]
    for (const id of expectedActions) {
      expect(
        document.querySelector(`button[data-action="${id}"]`),
        `missing button ${id}`
      ).not.toBeNull()
    }
    // 15 actions (14 plan-mandated + link renders a 15th due to inclusion)
    // — wait, per plan: 5 marks + 3 headings + 3 lists + 4 block = 15 total once link is counted.
    // The plan says "14 buttons" but enumerates 15 controls; reconcile: list link separately.
    expect(document.querySelectorAll('button[data-action]').length).toBe(
      expectedActions.length
    )
  })

  it('toolbar element has role=toolbar and aria-label', () => {
    const { editor } = createMockEditor()
    render(<FormatToolbar editor={editor} />)
    const el = screen.getByRole('toolbar', { name: /text formatting/i })
    expect(el).toBeInTheDocument()
  })

  it('clicking Bold builds focus().toggleBold().run() chain', () => {
    const { editor, chain } = createMockEditor()
    render(<FormatToolbar editor={editor} />)
    fireEvent.click(screen.getByRole('button', { name: 'Bold' }))
    expect(chain.focus).toHaveBeenCalled()
    expect(chain.toggleBold).toHaveBeenCalled()
    expect(chain.run).toHaveBeenCalled()
    expect(chain.callOrder.slice(0, 2)).toEqual(['focus', 'toggleBold'])
  })

  it.each([
    ['Italic', 'toggleItalic'],
    ['Underline', 'toggleUnderline'],
    ['Strikethrough', 'toggleStrike'],
    ['Inline code', 'toggleCode']
  ] as const)('clicking %s invokes %s', (label, commandName) => {
    const { editor, chain } = createMockEditor()
    render(<FormatToolbar editor={editor} />)
    fireEvent.click(screen.getByRole('button', { name: label }))
    expect(chain[commandName as keyof MockChain] as ReturnType<typeof vi.fn>).toHaveBeenCalled()
    expect(chain.run).toHaveBeenCalled()
  })

  it('clicking H2 invokes toggleHeading({ level: 2 })', () => {
    const { editor, chain } = createMockEditor()
    render(<FormatToolbar editor={editor} />)
    fireEvent.click(screen.getByRole('button', { name: 'Heading 2' }))
    expect(chain.toggleHeading).toHaveBeenCalledWith({ level: 2 })
  })

  it.each([
    ['Bullet list', 'toggleBulletList'],
    ['Ordered list', 'toggleOrderedList'],
    ['Task list', 'toggleTaskList'],
    ['Blockquote', 'toggleBlockquote'],
    ['Code block', 'toggleCodeBlock'],
    ['Horizontal rule', 'setHorizontalRule']
  ] as const)('clicking %s invokes %s', (label, commandName) => {
    const { editor, chain } = createMockEditor()
    render(<FormatToolbar editor={editor} />)
    fireEvent.click(screen.getByRole('button', { name: label }))
    expect(chain[commandName as keyof MockChain] as ReturnType<typeof vi.fn>).toHaveBeenCalled()
    expect(chain.run).toHaveBeenCalled()
  })

  it('reflects active state via aria-pressed', () => {
    const { editor } = createMockEditor({
      isActive: (name) => name === 'bold'
    })
    render(<FormatToolbar editor={editor} />)
    const boldBtn = screen.getByRole('button', { name: 'Bold' })
    expect(boldBtn).toHaveAttribute('aria-pressed', 'true')
    const italicBtn = screen.getByRole('button', { name: 'Italic' })
    expect(italicBtn).toHaveAttribute('aria-pressed', 'false')
  })

  it('re-renders when editor emits selectionUpdate', () => {
    let activeMark = 'bold'
    const { editor, emit } = createMockEditor({
      isActive: (name) => name === activeMark
    })
    render(<FormatToolbar editor={editor} />)
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )

    // Simulate a selection move into italic text.
    activeMark = 'italic'
    act(() => {
      emit('selectionUpdate')
    })
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('prevents default on mousedown so the editor keeps focus', () => {
    const { editor } = createMockEditor()
    render(<FormatToolbar editor={editor} />)
    const btn = screen.getByRole('button', { name: 'Bold' })
    const evt = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    btn.dispatchEvent(evt)
    expect(evt.defaultPrevented).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// LinkButton (via toolbar)
// ---------------------------------------------------------------------------

describe('Link button behavior', () => {
  it('Cancel (null) leaves the editor untouched', () => {
    const { editor, chain } = createMockEditor()
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(null)
    render(<FormatToolbar editor={editor} />)
    fireEvent.click(screen.getByRole('button', { name: 'Link' }))
    expect(promptSpy).toHaveBeenCalled()
    expect(chain.setLink).not.toHaveBeenCalled()
    expect(chain.unsetLink).not.toHaveBeenCalled()
  })

  it('Empty input calls unsetLink with extendMarkRange', () => {
    const { editor, chain } = createMockEditor({ linkHref: 'https://old.example' })
    vi.spyOn(window, 'prompt').mockReturnValue('')
    render(<FormatToolbar editor={editor} />)
    fireEvent.click(screen.getByRole('button', { name: 'Link' }))
    expect(chain.extendMarkRange).toHaveBeenCalledWith('link')
    expect(chain.unsetLink).toHaveBeenCalled()
  })

  it('Valid input calls setLink with sanitized URL', () => {
    const { editor, chain } = createMockEditor()
    vi.spyOn(window, 'prompt').mockReturnValue('example.com')
    render(<FormatToolbar editor={editor} />)
    fireEvent.click(screen.getByRole('button', { name: 'Link' }))
    expect(chain.setLink).toHaveBeenCalledWith({ href: 'https://example.com' })
  })

  it('JS-scheme input is rejected silently (no command invoked)', () => {
    const { editor, chain } = createMockEditor()
    vi.spyOn(window, 'prompt').mockReturnValue('javascript:alert(1)')
    render(<FormatToolbar editor={editor} />)
    fireEvent.click(screen.getByRole('button', { name: 'Link' }))
    expect(chain.setLink).not.toHaveBeenCalled()
    expect(chain.unsetLink).not.toHaveBeenCalled()
  })

  it('Pre-fills the prompt with the existing href when inside a link', () => {
    const { editor } = createMockEditor({ linkHref: 'https://already.here' })
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(null)
    render(<FormatToolbar editor={editor} />)
    fireEvent.click(screen.getByRole('button', { name: 'Link' }))
    expect(promptSpy).toHaveBeenCalledWith('Link URL', 'https://already.here')
  })
})
