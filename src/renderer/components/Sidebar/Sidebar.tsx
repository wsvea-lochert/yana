import { useCallback } from 'react'
import { Plus } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { SidebarHeader } from './SidebarHeader'
import { SidebarFooter } from './SidebarFooter'
import { FolderTree } from './FolderTree'
import { useNoteStore } from '../../stores/note.store'
import { useFolderStore } from '../../stores/folder.store'
import { useUiStore } from '../../stores/ui.store'
import { ShortcutHint } from '../shared/ShortcutHint'

export function Sidebar() {
  const notes = useNoteStore((s) => s.notes)
  const activeNoteId = useNoteStore((s) => s.activeNoteId)
  const selectNote = useNoteStore((s) => s.selectNote)
  const createNote = useNoteStore((s) => s.createNote)
  const moveNoteToFolder = useNoteStore((s) => s.moveNoteToFolder)
  const setPendingDeleteNoteId = useUiStore((s) => s.setPendingDeleteNoteId)
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen)
  const folders = useFolderStore((s) => s.folders)
  const collapsedFolderIds = useFolderStore((s) => s.collapsedFolderIds)
  const toggleCollapsed = useFolderStore((s) => s.toggleCollapsed)

  const handleSelectNote = useCallback(
    (id: string) => {
      selectNote(id)
    },
    [selectNote]
  )

  const handleDeleteNote = useCallback(
    (id: string) => {
      setPendingDeleteNoteId(id)
    },
    [setPendingDeleteNoteId]
  )

  const handleMoveNote = useCallback(
    (noteId: string, folder: string) => {
      moveNoteToFolder(noteId, folder)
    },
    [moveNoteToFolder]
  )

  const handleShowInFinder = useCallback((noteId: string) => {
    window.api.shell.showInFolder(noteId)
  }, [])

  const handleNewNote = useCallback(async () => {
    const metadata = await createNote({ title: 'Untitled' })
    await selectNote(metadata.id)
  }, [createNote, selectNote])

  return (
    <div className="flex flex-col h-full">
      <SidebarHeader />

      <ScrollArea className="flex-1 px-2 pb-2">
        <FolderTree
          notes={notes}
          folders={folders}
          activeNoteId={activeNoteId}
          collapsedFolderIds={collapsedFolderIds}
          onToggleCollapsed={toggleCollapsed}
          onSelectNote={handleSelectNote}
          onDeleteNote={handleDeleteNote}
          onMoveNote={handleMoveNote}
          onShowInFinder={handleShowInFinder}
        />
      </ScrollArea>

      <div className="px-3 pb-2 pt-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleNewNote}
                className="w-full h-9 gap-2 no-drag bg-gradient-to-b from-white/[0.1] to-transparent border border-white/[0.15]"
              >
                <Plus className="h-4 w-4" />
                New note
                <ShortcutHint
                  shortcut="Mod+N"
                  className="ml-0 bg-white/15 text-primary-foreground"
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Create a new note</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <SidebarFooter onOpenSettings={() => setSettingsOpen(true)} />
    </div>
  )
}
