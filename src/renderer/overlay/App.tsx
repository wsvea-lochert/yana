import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, X, PenLine, Plus, ArrowUpRight } from 'lucide-react'
import { EditorContent } from '@tiptap/react'
import { cn } from '@/lib/utils'
import { Kbd } from '@/components/ui/kbd'
import { ResultsList } from './ResultsList'
import { useOverlayEditor, extractTitleAndContent } from './useOverlayEditor'
import { AUTOSAVE_DEBOUNCE_MS } from '@shared/constants/defaults'
import type { OverlayApi } from '@shared/types/electron-env'
import type { SearchResult } from '@shared/types/search'

const overlayApi = window.api as unknown as OverlayApi

const SAVE_STATUS_DISPLAY_MS = 2000

type Mode = 'capture' | 'search'

export default function App() {
  const [mode, setMode] = useState<Mode>('capture')
  const [visible, setVisible] = useState(false)

  // Capture state
  const [currentMarkdown, setCurrentMarkdown] = useState('')
  const [savedText, setSavedText] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  const savedTextFromLoad = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Refs for listeners that need current values without stale closures
  const isDirtyRef = useRef(isDirty)
  isDirtyRef.current = isDirty

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
          // Set flag before setContent so the sync callback picks it up
          savedTextFromLoad.current = true
          setContent(md)
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
      setSaveStatus('idle')
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

  function parseEditorContent(): { title: string; content: string } {
    const md = getMarkdown()
    return extractTitleAndContent(md)
  }

  async function performSave(): Promise<boolean> {
    const { title, content } = parseEditorContent()
    if (!title || title === 'Untitled' || isSaving) return false
    setIsSaving(true)
    setSaveStatus('saving')
    try {
      if (editingNoteId) {
        await overlayApi.notes.update({ id: editingNoteId, title, content })
      } else {
        const metadata = await overlayApi.notes.create({ title, content })
        setEditingNoteId(metadata.id)
        overlayApi.config.set('activeNoteId', metadata.id).catch(() => {})
      }
      setSavedText(getMarkdown())
      setSaveStatus('saved')
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
      statusTimerRef.current = setTimeout(() => setSaveStatus('idle'), SAVE_STATUS_DISPLAY_MS)
      return true
    } catch {
      setSaveStatus('idle')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  // Keep a ref to performSave for the visibilitychange listener
  const performSaveRef = useRef(performSave)
  performSaveRef.current = performSave

  // Auto-save on content changes (debounced)
  useEffect(() => {
    if (currentMarkdown === savedText) return
    const { title } = extractTitleAndContent(currentMarkdown)
    if (!title || title === 'Untitled') return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      performSaveRef.current()
    }, AUTOSAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [currentMarkdown, savedText]) // eslint-disable-line react-hooks/exhaustive-deps

  // Flush pending save when window becomes hidden (covers production blur->hide)
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden && isDirtyRef.current) {
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current)
          saveTimerRef.current = null
        }
        performSaveRef.current()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
    }
  }, [])

  async function handleHide() {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    if (isDirty) {
      await performSave()
    }
    setVisible(false)
    overlayApi.overlay.hide()
  }

  async function handleSelect(noteId: string) {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    if (isDirty) {
      await performSave()
    }
    setVisible(false)
    overlayApi.overlay.navigate(noteId)
  }

  async function handleNewNote() {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    if (isDirty) {
      const saved = await performSave()
      if (!saved) return
    }
    startNewNote()
  }

  async function handleOpenInMainWindow() {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    if (isDirty) {
      await performSave()
    }
    setVisible(false)
    if (editingNoteId) {
      overlayApi.overlay.navigate(editingNoteId)
    } else {
      overlayApi.overlay.showMain()
    }
  }

  function startNewNote() {
    setContent('')
    setCurrentMarkdown('')
    setSavedText('')
    setEditingNoteId(null)
    setSaveStatus('idle')
    setTimeout(() => focus(), 50)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
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
      handleHide()
      return
    }

    if (mode === 'capture' && (e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault()
      handleNewNote()
      return
    }

    if (mode === 'capture' && (e.metaKey || e.ctrlKey) && e.key === 'o') {
      e.preventDefault()
      handleOpenInMainWindow()
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

        <button
          onClick={handleOpenInMainWindow}
          className="overlay-no-drag flex items-center gap-1 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Open in main window"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
          <span className="text-[10px] opacity-50">{navigator.platform.includes('Mac') ? '\u2318' : 'Ctrl+'}O</span>
        </button>

        <button
          onClick={handleHide}
          className="overlay-no-drag p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="h-px bg-border mx-3" />

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {mode === 'capture' ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 px-4 pt-3 pb-2 overflow-y-auto overlay-editor-scroll">
              <EditorContent editor={editor} />
            </div>

            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
              <button
                onClick={handleNewNote}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-muted-foreground/60 hover:text-foreground hover:bg-accent transition-colors"
                title="New note"
              >
                <Plus className="h-3 w-3" />
                <span>New</span>
                <span className="text-[10px] ml-1 opacity-50">{navigator.platform.includes('Mac') ? '\u2318' : 'Ctrl+'}N</span>
              </button>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-[11px] transition-opacity duration-300',
                    saveStatus === 'idle' ? 'opacity-0' : 'opacity-100',
                    saveStatus === 'saved' ? 'text-emerald-500' : 'text-muted-foreground'
                  )}
                >
                  {saveStatus === 'saving' && 'Saving...'}
                  {saveStatus === 'saved' && 'Saved \u2713'}
                </span>
                <button
                  onClick={handleHide}
                  className={cn(
                    'px-4 py-1.5 text-xs font-medium rounded-md transition-colors',
                    'bg-primary text-primary-foreground',
                    'hover:bg-primary/90'
                  )}
                >
                  Done
                  <Kbd className="ml-2 text-[10px] h-auto py-0.5 bg-white/15 text-primary-foreground">{navigator.platform.includes('Mac') ? '\u2318' : 'Ctrl'}</Kbd>
                  <span className="mx-0.5 text-[10px] text-primary-foreground/60">+</span>
                  <Kbd className="text-[10px] h-auto py-0.5 bg-white/15 text-primary-foreground">{'\u23CE'}</Kbd>
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
