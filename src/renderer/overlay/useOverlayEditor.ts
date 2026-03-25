import { useRef, useCallback, useEffect } from 'react'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { Markdown } from 'tiptap-markdown'
import { Extension } from '@tiptap/core'
import { common, createLowlight } from 'lowlight'

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

export function extractTitleAndContent(markdown: string): {
  title: string
  content: string
} {
  const lines = markdown.split('\n')
  const firstLine = lines[0] ?? ''
  const title = firstLine.replace(/^#\s+/, '').trim() || 'Untitled'

  let contentStart = 1
  while (contentStart < lines.length && lines[contentStart].trim() === '') {
    contentStart++
  }
  const content = lines.slice(contentStart).join('\n')

  return { title, content }
}

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
      CodeBlockLowlight.configure({ lowlight }),
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
      onUpdateRef.current(md)
    }
  })

  // Apply pending content once editor is ready, then sync normalized markdown
  useEffect(() => {
    if (editor && pendingContent.current !== null) {
      isSettingContent.current = true
      editor.commands.setContent(pendingContent.current)
      isSettingContent.current = false
      pendingContent.current = null
      const normalized = editor.storage.markdown.getMarkdown()
      onUpdateRef.current(normalized)
    }
  }, [editor])

  const getMarkdown = useCallback((): string => {
    if (!editor) return ''
    return editor.storage.markdown.getMarkdown()
  }, [editor])

  const setContent = useCallback(
    (markdown: string) => {
      if (!editor) {
        pendingContent.current = markdown
        return
      }
      isSettingContent.current = true
      editor.commands.setContent(markdown)
      isSettingContent.current = false
      const normalized = editor.storage.markdown.getMarkdown()
      onUpdateRef.current(normalized)
    },
    [editor]
  )

  const focus = useCallback(() => {
    editor?.commands.focus()
  }, [editor])

  return { editor, getMarkdown, setContent, focus }
}
