import { Link2 } from 'lucide-react'
import type { Editor } from '@tiptap/react'
import { ToolbarButton } from './ToolbarButton'

interface LinkButtonProps {
  editor: Editor
  isActive: boolean
}

/**
 * Validate and normalize a user-entered URL. Accepts `http(s)://`, `mailto:`,
 * `tel:`, fragment (`#...`) and absolute-path (`/...`) as-is. Anything else
 * is assumed to be a bare domain and prefixed with `https://`.
 *
 * Rejects inputs that remain structurally invalid (returns `null` so the
 * caller can silently skip the setLink command).
 */
export function sanitizeLinkUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  // Block obvious XSS vectors.
  if (/^\s*javascript:/i.test(trimmed) || /^\s*data:/i.test(trimmed)) {
    return null
  }

  if (/^(https?:|mailto:|tel:|#|\/)/i.test(trimmed)) {
    return trimmed
  }

  return `https://${trimmed}`
}

export function LinkButton({ editor, isActive }: LinkButtonProps) {
  const handleActivate = (): void => {
    const previousHref =
      (editor.getAttributes('link').href as string | undefined) ?? ''
    const input = window.prompt('Link URL', previousHref || 'https://')

    // User pressed Cancel.
    if (input === null) return

    // Empty string clears the link.
    if (input.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    const safe = sanitizeLinkUrl(input)
    if (!safe) return

    editor.chain().focus().extendMarkRange('link').setLink({ href: safe }).run()
  }

  return (
    <ToolbarButton
      icon={Link2}
      label="Link"
      shortcut="⌘K"
      isActive={isActive}
      onActivate={handleActivate}
      dataAction="link"
    />
  )
}
