import { useCallback, useEffect, useRef, useState } from 'react'
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { Copy, Check } from 'lucide-react'

const COPIED_FEEDBACK_MS = 1500

export function CodeBlockView({ node }: NodeViewProps) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(node.textContent)
      setCopied(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
    } catch {
      // Clipboard API can fail in some contexts (e.g., lost focus); swallow —
      // the editor still functions, user can fall back to manual copy.
    }
  }, [node.textContent])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <NodeViewWrapper className="code-block-wrapper">
      <pre>
        <NodeViewContent as="code" />
      </pre>
      <button
        type="button"
        className="code-block-copy-btn"
        data-copied={copied || undefined}
        aria-label={copied ? 'Copied' : 'Copy code to clipboard'}
        onClick={handleCopy}
        onMouseDown={(e) => e.preventDefault()}
        contentEditable={false}
      >
        {copied ? (
          <>
            <Check size={12} aria-hidden="true" />
            Copied
          </>
        ) : (
          <>
            <Copy size={12} aria-hidden="true" />
            Copy
          </>
        )}
      </button>
    </NodeViewWrapper>
  )
}
