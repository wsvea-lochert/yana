import { useEffect, useRef, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { Markdown } from 'tiptap-markdown'
import { common, createLowlight } from 'lowlight'
import { useNoteStore } from '../../stores/note.store'
import { AUTOSAVE_DEBOUNCE_MS } from '@shared/constants/defaults'
import { WikiLink } from './extensions/wiki-link'
import { LoadingBar } from '../shared/LoadingBar'
import { Kbd } from '@/components/ui/kbd'
import { titleToSlug } from '@shared/utils/slug'
import './editor.css'

const lowlight = createLowlight(common)

function extractTitleAndContent(markdown: string): { title: string; content: string } {
  const lines = markdown.split('\n')
  const firstLine = lines[0] ?? ''
  const title = firstLine.replace(/^#\s+/, '').trim() || 'Untitled'

  // Skip the heading line and any blank lines immediately after it
  let contentStart = 1
  while (contentStart < lines.length && lines[contentStart].trim() === '') {
    contentStart++
  }
  const content = lines.slice(contentStart).join('\n')

  return { title, content }
}

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
        const { title, content } = extractTitleAndContent(markdown)
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
      CodeBlockLowlight.configure({
        lowlight
      }),
      Markdown,
      WikiLink.configure({
        onNavigate: handleWikiNavigate
      })
    ],
    editorProps: {
      attributes: {
        class:
          'prose prose-lg max-w-none leading-[1.7] outline-none min-h-[calc(100vh-4rem)] px-12 py-8'
      }
    },
    onUpdate: ({ editor: ed }) => {
      const markdown = ed.storage.markdown.getMarkdown()
      handleSave(markdown)
    }
  })

  useEffect(() => {
    if (!editor || !activeNote) return
    isSettingContent.current = true
    const title = activeNote.frontmatter.title
    const content = activeNote.content
    const fullContent = content ? `# ${title}\n\n${content}` : `# ${title}`
    editor.commands.setContent(fullContent)
    isSettingContent.current = false
  }, [editor, activeNote?.id]) // eslint-disable-line react-hooks/exhaustive-deps

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
    <div>
      {isLoading && <LoadingBar />}
      <EditorContent editor={editor} />
    </div>
  )
}
