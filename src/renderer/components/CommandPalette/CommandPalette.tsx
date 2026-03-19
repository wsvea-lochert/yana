import { useEffect, useState, useCallback } from 'react'
import { FileText, Plus, Trash2, Settings } from 'lucide-react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useNoteStore } from '../../stores/note.store'
import { useUiStore } from '../../stores/ui.store'
import type { SearchResult } from '@shared/types/search'

interface CommandPaletteProps {
  readonly onOpenSettings: () => void
}

export function CommandPalette({ onOpenSettings }: CommandPaletteProps) {
  const open = useUiStore((s) => s.commandPaletteOpen)
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen)
  const selectNote = useNoteStore((s) => s.selectNote)
  const createNote = useNoteStore((s) => s.createNote)
  const deleteNote = useNoteStore((s) => s.deleteNote)
  const activeNoteId = useNoteStore((s) => s.activeNoteId)
  const activeNote = useNoteStore((s) => s.activeNote)

  const [searchValue, setSearchValue] = useState('')
  const [results, setResults] = useState<readonly SearchResult[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const doSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setResults([])
      return
    }
    try {
      const r = await window.api.search.query({ term, limit: 10 })
      setResults(r)
    } catch {
      setResults([])
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => doSearch(searchValue), 150)
    return () => clearTimeout(timer)
  }, [searchValue, doSearch])

  function handleClose() {
    setOpen(false)
    setSearchValue('')
    setResults([])
  }

  async function handleSelectNote(id: string) {
    await selectNote(id)
    handleClose()
  }

  async function handleNewNote() {
    const metadata = await createNote({ title: searchValue || 'Untitled' })
    await selectNote(metadata.id)
    handleClose()
  }

  function handleDeleteCurrent() {
    setShowDeleteConfirm(true)
  }

  async function confirmDelete() {
    if (activeNoteId) {
      await deleteNote(activeNoteId)
    }
    setShowDeleteConfirm(false)
    handleClose()
  }

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          value={searchValue}
          onValueChange={setSearchValue}
          placeholder="Search notes or type a command..."
        />
        <CommandList>
          <CommandEmpty>No results. Press Enter to create a new note.</CommandEmpty>

          {results.length > 0 && (
            <CommandGroup heading="Notes">
              {results.map((result) => (
                <CommandItem
                  key={result.id}
                  value={result.title}
                  onSelect={() => handleSelectNote(result.id)}
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{result.title}</p>
                    {result.excerpt && (
                      <p className="text-xs text-muted-foreground truncate">
                        {result.excerpt}
                      </p>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandGroup heading="Actions">
            <CommandItem onSelect={handleNewNote}>
              <Plus className="h-4 w-4 text-primary" />
              <span>New note{searchValue ? `: "${searchValue}"` : ''}</span>
            </CommandItem>
            {activeNoteId && (
              <CommandItem onSelect={handleDeleteCurrent} className="text-destructive">
                <Trash2 className="h-4 w-4" />
                <span>
                  Delete &ldquo;{activeNote?.frontmatter.title ?? 'current note'}&rdquo;
                </span>
              </CommandItem>
            )}
            <CommandItem
              onSelect={() => {
                handleClose()
                onOpenSettings()
              }}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;
              {activeNote?.frontmatter.title ?? 'this note'}
              &rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
