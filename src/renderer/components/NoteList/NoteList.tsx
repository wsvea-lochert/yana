import { useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { NoteListItem } from './NoteListItem'
import { NoteListSearch } from './NoteListSearch'
import { NoteListContextMenu } from './NoteListContextMenu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Kbd } from '@/components/ui/kbd'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { useNoteStore } from '../../stores/note.store'
import { useSearch } from '../../hooks/use-search'
import { useKeyboardNav } from '../../hooks/use-keyboard-nav'
import { sortNotes } from '@shared/utils/sort'

interface ContextMenuState {
  readonly noteId: string
  readonly x: number
  readonly y: number
}

export function NoteList() {
  const notes = useNoteStore((s) => s.notes)
  const activeNoteId = useNoteStore((s) => s.activeNoteId)
  const selectNote = useNoteStore((s) => s.selectNote)
  const createNote = useNoteStore((s) => s.createNote)
  const deleteNote = useNoteStore((s) => s.deleteNote)
  const { query, setQuery, results, isSearching } = useSearch()

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const filteredNotes = query.trim()
    ? results.map((r) => notes.find((n) => n.id === r.id)).filter(Boolean)
    : sortNotes([...notes], 'modified', 'desc')

  const handleSelect = useCallback(
    (index: number) => {
      const note = filteredNotes[index]
      if (note) selectNote(note.id)
    },
    [filteredNotes, selectNote]
  )

  const handleDeleteAtIndex = useCallback(
    (index: number) => {
      const note = filteredNotes[index]
      if (note) setDeleteTarget(note.id)
    },
    [filteredNotes]
  )

  const { focusedIndex, handleKeyDown } = useKeyboardNav({
    itemCount: filteredNotes.length,
    onSelect: handleSelect,
    onDelete: handleDeleteAtIndex
  })

  async function handleNewNote() {
    const metadata = await createNote({ title: 'Untitled' })
    await selectNote(metadata.id)
  }

  function handleContextMenu(noteId: string, e: React.MouseEvent) {
    e.preventDefault()
    setContextMenu({ noteId, x: e.clientX, y: e.clientY })
  }

  async function confirmDelete() {
    if (deleteTarget) {
      await deleteNote(deleteTarget)
      setDeleteTarget(null)
    }
  }

  const deleteTargetNote = deleteTarget ? notes.find((n) => n.id === deleteTarget) : null

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2 flex items-center gap-2">
        <NoteListSearch query={query} onChange={setQuery} isSearching={isSearching} />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="icon"
                onClick={handleNewNote}
                className="flex-shrink-0 no-drag h-8 w-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span className="flex items-center gap-1.5">
                New note <Kbd className="text-[10px]">{navigator.platform.includes('Mac') ? '\u2318' : 'Ctrl'}+N</Kbd>
              </span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <ScrollArea
        className="flex-1 px-2 pb-2"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {filteredNotes.map(
          (note, index) =>
            note && (
              <NoteListItem
                key={note.id}
                note={note}
                index={index}
                isActive={note.id === activeNoteId}
                isFocused={index === focusedIndex}
                onClick={() => selectNote(note.id)}
                onContextMenu={(e) => handleContextMenu(note.id, e)}
              />
            )
        )}
        {filteredNotes.length === 0 && (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            {query.trim() ? 'No results found' : 'No notes yet'}
          </div>
        )}
      </ScrollArea>

      {contextMenu && (
        <NoteListContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onDelete={() => setDeleteTarget(contextMenu.noteId)}
          onClose={() => setContextMenu(null)}
        />
      )}

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTargetNote?.title ?? 'this note'}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
