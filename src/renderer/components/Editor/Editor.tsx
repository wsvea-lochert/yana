import { useEffect, useRef, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import { Markdown } from 'tiptap-markdown'
import { common, createLowlight } from 'lowlight'
import { toast } from 'sonner'
import { useNoteStore } from '../../stores/note.store'
import { AUTOSAVE_DEBOUNCE_MS } from '@shared/constants/defaults'
import { WikiLink } from './extensions/wiki-link'
import { FileLink } from './extensions/file-link-node'
import { AttachmentUpload } from './extensions/attachment-upload'
import { CodeBlockWithCopy } from './extensions/code-block-copy'
import { FormatToolbar } from './FormatToolbar/FormatToolbar'
import {
  markdownProtocolToRelative,
  markdownRelativeToProtocol
} from '@renderer/services/attachment-client'
import { LoadingBar } from '../shared/LoadingBar'
import { Kbd } from '@/components/ui/kbd'
import { titleToSlug } from '@shared/utils/slug'
import { extractTitleAndContent } from '@shared/utils/markdown-title'
import './editor.css'

const lowlight = createLowlight(common)

export function Editor() {
  const activeNote = useNoteStore((s) => s.activeNote)
  const isLoading = useNoteStore((s) => s.isLoading)
  const notes = useNoteStore((s) => s.notes)
  const updateNote = useNoteStore((s) => s.updateNote)
  const selectNote = useNoteStore((s) => s.selectNote)
  const createNote = useNoteStore((s) => s.createNote)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSettingContent = useRef(false)

  const handleWikiNavigate = useCallback(
    async (target: string) => {
      const targetLower = target.toLowerCase()
      const targetSlug = titleToSlug(target)

      const existing = notes.find(
        (n) =>
          n.title.toLowerCase() === targetLower ||
          titleToSlug(n.title) === targetSlug
      )

      if (existing) {
        await selectNote(existing.id)
      } else {
        const created = await createNote({ title: target })
        await selectNote(created.id)
      }
    },
    [notes, selectNote, createNote]
  )

  const handleSave = useCallback(
    (markdown: string) => {
      if (!activeNote || isSettingContent.current) return
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        const portable = markdownProtocolToRelative(markdown)
        const { title, content } = extractTitleAndContent(portable)
        updateNote({ id: activeNote.id, title, content })
      }, AUTOSAVE_DEBOUNCE_MS)
    },
    [activeNote, updateNote]
  )

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false
      }),
      TaskList,
      TaskItem.configure({
        nested: true
      }),
      Underline,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading' && node.attrs.level === 1) {
            return 'Note title...'
          }
          return 'Start writing...'
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-sage underline decoration-sage/30 hover:decoration-sage' }
      }),
      CodeBlockWithCopy.configure({
        lowlight
      }),
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
      WikiLink.configure({
        onNavigate: handleWikiNavigate
      })
    ],
    editorProps: {
      attributes: {
        class:
          'prose prose-lg max-w-none leading-[1.7] outline-none min-h-[calc(100vh-4rem)] px-12 pt-8 pb-28'
      }
    },
    onUpdate: ({ editor: ed }) => {
      const markdown = ed.storage.markdown.getMarkdown()
      handleSave(markdown)
    }
  })

  useEffect(() => {
    if (!editor || !activeNote) return

    const title = activeNote.frontmatter.title
    const content = activeNote.content
    const fullContent = content ? `# ${title}\n\n${content}` : `# ${title}`
    const renderable = markdownRelativeToProtocol(fullContent)

    // Compare with current editor content to avoid cursor disruption on self-authored saves.
    // Only call setContent when the content actually differs (i.e. an external change from the overlay).
    const currentMarkdown = editor.storage.markdown.getMarkdown()
    const currentPortable = markdownProtocolToRelative(currentMarkdown)
    const { title: currentTitle, content: currentContent } = extractTitleAndContent(currentPortable)
    if (currentTitle.trim() === title.trim() && currentContent.trim() === content.trim()) {
      return
    }

    // TipTap's setContent dispatches a synchronous transaction, so onUpdate fires
    // while isSettingContent.current is still true. This guard prevents save loops.
    isSettingContent.current = true
    editor.commands.setContent(renderable)
    isSettingContent.current = false
    // Dependencies intentionally limited to id + modified timestamp.
    // We read title and content inside the effect but only want to re-sync
    // when the note is externally modified (new modified timestamp), not on every
    // keystroke. The content comparison guard above handles the rest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, activeNote?.id, activeNote?.frontmatter.modified])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  if (!activeNote) {
    return (
      <div className="flex items-center justify-center h-full text-ink/30 dark:text-warm-white/30">
        <div className="text-center">
          <p className="text-2xl mb-2">Yana</p>
          <p className="text-sm">
            Select a note or press{' '}
            <Kbd>⌘+N</Kbd>{' '}
            to create one
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {isLoading && <LoadingBar />}
      <EditorContent editor={editor} />
      <FormatToolbar editor={editor} />
    </div>
  )
}
