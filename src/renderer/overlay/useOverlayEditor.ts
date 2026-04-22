import { useRef, useCallback, useEffect } from 'react'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'
import { Markdown } from 'tiptap-markdown'
import { Extension } from '@tiptap/core'
import { toast } from 'sonner'
import { common, createLowlight } from 'lowlight'
import { CodeBlockWithCopy } from '@renderer/components/Editor/extensions/code-block-copy'
import { FileLink } from '@renderer/components/Editor/extensions/file-link-node'
import { AttachmentUpload } from '@renderer/components/Editor/extensions/attachment-upload'
import {
  markdownProtocolToRelative,
  markdownRelativeToProtocol
} from '@renderer/services/attachment-client'

const lowlight = createLowlight(common)

/** Ensures Tab, Shift-Tab, and Escape bubble to the overlay container. */
const OverlayKeymap = Extension.create({
  name: 'overlayKeymap',
  addKeyboardShortcuts() {
    return {
      Tab: () => false,
      'Shift-Tab': () => false,
      Escape: () => false
    }
  }
})

export { extractTitleAndContent } from '@shared/utils/markdown-title'

interface UseOverlayEditorOptions {
  onUpdate: (markdown: string) => void
}

export interface UseOverlayEditorReturn {
  editor: ReturnType<typeof useEditor>
  getMarkdown: () => string
  setContent: (markdown: string) => void
  focus: () => void
}

export function useOverlayEditor({
  onUpdate
}: UseOverlayEditorOptions): UseOverlayEditorReturn {
  const isSettingContent = useRef(false)
  const pendingContent = useRef<string | null>(null)
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlockWithCopy.configure({ lowlight }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: { class: 'yana-image' }
      }),
      FileLink,
      AttachmentUpload.configure({
        onError: (message, error) => {
          // eslint-disable-next-line no-console
          console.error(message, error)
          toast.error(message)
        }
      }),
      Markdown,
      Placeholder.configure({
        placeholder: 'Start typing... First line becomes the title'
      }),
      OverlayKeymap
    ],
    editorProps: {
      attributes: {
        class: 'overlay-prose'
      }
    },
    onUpdate: ({ editor: ed }) => {
      if (isSettingContent.current) return
      const md = ed.storage.markdown.getMarkdown()
      onUpdateRef.current(markdownProtocolToRelative(md))
    }
  })

  // Apply pending content once editor is ready, then sync normalized markdown
  useEffect(() => {
    if (editor && pendingContent.current !== null) {
      isSettingContent.current = true
      editor.commands.setContent(markdownRelativeToProtocol(pendingContent.current))
      isSettingContent.current = false
      pendingContent.current = null
      const normalized = editor.storage.markdown.getMarkdown()
      onUpdateRef.current(markdownProtocolToRelative(normalized))
    }
  }, [editor])

  const getMarkdown = useCallback((): string => {
    if (!editor) return ''
    return markdownProtocolToRelative(editor.storage.markdown.getMarkdown())
  }, [editor])

  const setContent = useCallback(
    (markdown: string) => {
      if (!editor) {
        pendingContent.current = markdown
        return
      }
      isSettingContent.current = true
      editor.commands.setContent(markdownRelativeToProtocol(markdown))
      isSettingContent.current = false
      const normalized = editor.storage.markdown.getMarkdown()
      onUpdateRef.current(markdownProtocolToRelative(normalized))
    },
    [editor]
  )

  const focus = useCallback(() => {
    editor?.commands.focus()
  }, [editor])

  return { editor, getMarkdown, setContent, focus }
}
