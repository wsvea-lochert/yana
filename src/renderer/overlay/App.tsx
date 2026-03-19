import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, X, PenLine, Plus } from 'lucide-react'
import { EditorContent } from '@tiptap/react'
import { cn } from '@/lib/utils'
import { Kbd } from '@/components/ui/kbd'
import { Button } from '@/components/ui/button'
import { ResultsList } from './ResultsList'
import { useOverlayEditor, extractTitleAndContent } from './useOverlayEditor'
import type { OverlayApi } from '@shared/types/electron-env'
import type { SearchResult } from '@shared/types/search'

const overlayApi = window.api as unknown as OverlayApi

type Mode = 'capture' | 'search'

export default function App() {
  const [mode, setMode] = useState<Mode>('capture')
  const [visible, setVisible] = useState(false)

  // Capture state
  const [currentMarkdown, setCurrentMarkdown] = useState('')
  const [savedText, setSavedText] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false)

  const savedTextFromLoad = useRef(false)

  const handleEditorUpdate = useCallback((md: string) => {
    setCurrentMarkdown(md)
    // When content is loaded into the editor, sync savedText to the
    // normalized markdown so isDirty starts as false.
    if (savedTextFromLoad.current) {
      savedTextFromLoad.current = false
      setSavedText(md)
    }
  }, [])

  const { editor, getMarkdown, setContent, focus } = useOverlayEditor({
    onUpdate: handleEditorUpdate
  })

  // Search state
  const [results, setResults] = useState<readonly SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const isDirty = currentMarkdown !== savedText

  const handleSearch = useCallback(async (term: string) => {
    try {
      if (!term.trim()) {
        const allNotes = await overlayApi.notes.list()
        const mapped: SearchResult[] = allNotes.map((n) => ({
          id: n.id,
          title: n.title,
          excerpt: n.excerpt,
          score: 0,
          matchType: 'title' as const,
          tags: [...n.tags],
          modified: n.modified
        }))
        setResults(mapped)
      } else {
        const r = await overlayApi.search.quick(term)
        setResults(r)
      }
      setSelectedIndex(0)
    } catch {
      setResults([])
    }
  }, [])

  useEffect(() => {
    if (mode !== 'search') return
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => handleSearch(searchTerm), 50)
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [searchTerm, handleSearch, mode])

  // Load all notes when switching to search mode
  useEffect(() => {
    if (mode === 'search') {
      handleSearch(searchTerm)
    }
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadActiveNote = useCallback(async () => {
    try {
      const activeId = await overlayApi.config.get('activeNoteId')
      if (typeof activeId === 'string' && activeId) {
        const note = await overlayApi.notes.get(activeId)
        if (note) {
          const title = note.frontmatter.title
          const rest = note.content
          const md = rest ? `# ${title}\n\n${rest}` : `# ${title}`
          setContent(md)
          // savedText is set to raw md here; the pending-content useEffect
          // in the hook will fire onUpdate with normalized markdown, which
          // updates currentMarkdown. We use a ref-based flag to sync both.
          savedTextFromLoad.current = true
          setEditingNoteId(activeId)
          return
        }
      }
    } catch {
      // fall through to blank
    }
    setContent('')
    setCurrentMarkdown('')
    setSavedText('')
    setEditingNoteId(null)
  }, [setContent])

  useEffect(() => {
    const unsubscribe = overlayApi.on.overlayShown(() => {
      setVisible(true)
      setSelectedIndex(0)
      setMode('capture')
      setSearchTerm('')
      setIsSaving(false)
      setShowUnsavedPrompt(false)
      loadActiveNote()
      setTimeout(() => focus(), 50)
    })
    setVisible(true)
    loadActiveNote()
    return unsubscribe
  }, [loadActiveNote, focus])

  useEffect(() => {
    if (mode === 'capture') {
      focus()
    } else {
      searchRef.current?.focus()
    }
  }, [mode, focus])

  function handleHide() {
    setVisible(false)
    overlayApi.overlay.hide()
  }

  function handleSelect(noteId: string) {
    setVisible(false)
    overlayApi.overlay.navigate(noteId)
  }

  function parseEditorContent(): { title: string; content: string } {
    const md = getMarkdown()
    return extractTitleAndContent(md)
  }

  async function performSave(): Promise<boolean> {
    const { title, content } = parseEditorContent()
    if (!title || title === 'Untitled' || isSaving) return false
    setIsSaving(true)
    try {
      if (editingNoteId) {
        await overlayApi.notes.update({ id: editingNoteId, title, content })
      } else {
        await overlayApi.notes.create({ title, content })
      }
      return true
    } catch {
      return false
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSave() {
    const saved = await performSave()
    if (saved) handleHide()
  }

  function handleNewNote() {
    if (isDirty) {
      setShowUnsavedPrompt(true)
    } else {
      startNewNote()
    }
  }

  function startNewNote() {
    setContent('')
    setCurrentMarkdown('')
    setSavedText('')
    setEditingNoteId(null)
    setShowUnsavedPrompt(false)
    setTimeout(() => focus(), 50)
  }

  async function saveAndNewNote() {
    await performSave()
    startNewNote()
  }

  function discardAndNewNote() {
    startNewNote()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (showUnsavedPrompt) {
      if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault()
        saveAndNewNote()
        return
      }
      if (e.key === 'n' || e.key === 'N' || e.key === 'Escape') {
        e.preventDefault()
        discardAndNewNote()
        return
      }
      return
    }

    if (e.key === 'Escape') {
      handleHide()
      return
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      setMode((m) => (m === 'capture' ? 'search' : 'capture'))
      return
    }

    if (mode === 'capture' && (e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
      return
    }

    if (mode === 'capture' && (e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault()
      handleNewNote()
      return
    }

    if (mode === 'search') {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault()
        handleSelect(results[selectedIndex].id)
      }
    }
  }

  const { title: parsedTitle } = parseEditorContent()

  return (
    <div
      onKeyDown={handleKeyDown}
      className={cn(
        'h-full flex flex-col bg-background rounded-xl overflow-hidden',
        'shadow-[0_24px_80px_-12px_rgba(0,0,0,0.4)]',
        'transition-all duration-150',
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.97]'
      )}
    >
      {/* Mode switcher — draggable bar */}
      <div className="flex items-center gap-1 px-3 pt-3 pb-2 overlay-drag">
        <button
          onClick={() => setMode('capture')}
          className={cn(
            'overlay-no-drag flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
            mode === 'capture'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
        >
          <PenLine className="h-3 w-3" />
          {editingNoteId ? 'Edit' : 'Capture'}
        </button>
        <button
          onClick={() => setMode('search')}
          className={cn(
            'overlay-no-drag flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
            mode === 'search'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
        >
          <Search className="h-3 w-3" />
          Search
        </button>

        <div className="flex-1" />

        {mode === 'capture' && (
          <button
            onClick={handleNewNote}
            className="overlay-no-drag p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="New note"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          onClick={handleHide}
          className="overlay-no-drag p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="h-px bg-border mx-3" />

      {/* Unsaved changes prompt */}
      {showUnsavedPrompt && (
        <div className="px-4 py-3 bg-accent/50 border-b border-border flex items-center justify-between">
          <p className="text-sm">Save changes before creating a new note?</p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={discardAndNewNote}
              className="h-7 text-xs gap-1"
            >
              Discard <Kbd className="text-[9px]">N</Kbd>
            </Button>
            <Button
              size="sm"
              onClick={saveAndNewNote}
              className="h-7 text-xs gap-1"
            >
              Save <Kbd className="text-[9px]">Y</Kbd>
            </Button>
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {mode === 'capture' ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 px-4 pt-3 pb-2 overflow-y-auto overlay-editor-scroll">
              <EditorContent editor={editor} />
            </div>

            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60">
                <span className="flex items-center gap-1">
                  <Kbd className="text-[10px]">{navigator.platform.includes('Mac') ? '\u2318' : 'Ctrl'}</Kbd>
                  <span>+</span>
                  <Kbd className="text-[10px]">Enter</Kbd>
                  <span className="ml-0.5">save</span>
                </span>
                <span className="flex items-center gap-1">
                  <Kbd className="text-[10px]">{navigator.platform.includes('Mac') ? '\u2318' : 'Ctrl'}</Kbd>
                  <span>+</span>
                  <Kbd className="text-[10px]">N</Kbd>
                  <span className="ml-0.5">new</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isDirty && (
                  <span className="text-[11px] text-muted-foreground">unsaved</span>
                )}
                <button
                  onClick={handleSave}
                  disabled={!parsedTitle || parsedTitle === 'Untitled' || isSaving}
                  className={cn(
                    'px-4 py-1.5 text-xs font-medium rounded-md transition-colors',
                    'bg-primary text-primary-foreground',
                    'hover:bg-primary/90',
                    'disabled:opacity-30 disabled:cursor-not-allowed'
                  )}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="px-4 py-3">
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search notes..."
                className="w-full text-sm bg-transparent outline-none placeholder:text-muted-foreground/40 text-foreground"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              <ResultsList
                results={results}
                selectedIndex={selectedIndex}
                onSelect={handleSelect}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
