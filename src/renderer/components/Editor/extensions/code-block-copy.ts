import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { CodeBlockView } from './CodeBlockView'

/**
 * Extends the default CodeBlockLowlight with a React NodeView so we can
 * render a hoverable "Copy" button over the fenced block. All markdown
 * behavior (lowlight highlighting, language attribute, round-trip) is
 * inherited unchanged.
 */
export const CodeBlockWithCopy = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView)
  }
})
