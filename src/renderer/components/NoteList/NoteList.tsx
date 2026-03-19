import { useCallback } from 'react'
import { Plus } from 'lucide-react'
import { NoteListItem } from './NoteListItem'
import { NoteListSearch } from './NoteListSearch'
import { NoteListContextMenu } from './NoteListContextMenu'
import { ShortcutHint } from '../shared/ShortcutHint'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Kbd } from '@/components/ui/kbd'
import { useNoteStore } from '../../stores/note.store'
import { useUiStore } from '../../stores/ui.store'
import { useSearch } from '../../hooks/use-search'
import { useKeyboardNav } from '../../hooks/use-keyboard-nav'
import { sortNotes } from '@shared/utils/sort'

export function NoteList() {
  const notes = useNoteStore((s) => s.notes)
  const activeNoteId = useNoteStore((s) => s.activeNoteId)
  const selectNote = useNoteStore((s) => s.selectNote)
  const createNote = useNoteStore((s) => s.createNote)
  const setPendingDeleteNoteId = useUiStore((s) => s.setPendingDeleteNoteId)
  const modifierHeld = useUiStore((s) => s.modifierHeld)
  const { query, setQuery, results, isSearching } = useSearch()

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
      if (note) setPendingDeleteNoteId(note.id)
    },
    [filteredNotes, setPendingDeleteNoteId]
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

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2 flex items-center gap-2">
        <NoteListSearch query={query} onChange={setQuery} isSearching={isSearching} />
      </div>

      <ScrollArea
        className="flex-1 px-2 pb-2"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {filteredNotes.map(
          (note, index) =>
            note && (
              <NoteListContextMenu
                key={note.id}
                onDelete={() => setPendingDeleteNoteId(note.id)}
                onShowInFinder={() => window.api.shell.showInFolder(note.id)}
              >
                <NoteListItem
                  note={note}
                  index={index}
                  isActive={note.id === activeNoteId}
                  isFocused={index === focusedIndex}
                  onClick={() => selectNote(note.id)}
                />
              </NoteListContextMenu>
            )
        )}
        {filteredNotes.length === 0 && (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            {query.trim() ? 'No results found' : 'No notes yet'}
          </div>
        )}
      </ScrollArea>

      <div className="px-3 pb-3 pt-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleNewNote}
                className="no-drag w-full h-9 flex items-center justify-center gap-2 rounded-lg text-sm font-medium text-primary-foreground bg-primary transition-colors hover:bg-primary/90 border border-white/[0.15] bg-gradient-to-b from-white/[0.1] to-transparent"
              >
                <Plus className="h-4 w-4" />
                New note
                <ShortcutHint shortcut="Mod+N" className="ml-0 bg-white/15 text-primary-foreground" />
              </button>
            </TooltipTrigger>
            {!modifierHeld && (
              <TooltipContent>
                <Kbd className="text-[10px]">{navigator.platform.includes('Mac') ? '\u2318' : 'Ctrl'} + N</Kbd>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
