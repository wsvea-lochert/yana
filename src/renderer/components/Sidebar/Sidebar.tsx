import { useCallback } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SidebarHeader } from './SidebarHeader'
import { SidebarFooter } from './SidebarFooter'
import { FolderTree } from './FolderTree'
import { useNoteStore } from '../../stores/note.store'
import { useFolderStore } from '../../stores/folder.store'
import { useUiStore } from '../../stores/ui.store'

export function Sidebar() {
  const notes = useNoteStore((s) => s.notes)
  const activeNoteId = useNoteStore((s) => s.activeNoteId)
  const selectNote = useNoteStore((s) => s.selectNote)
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

      <SidebarFooter onOpenSettings={() => setSettingsOpen(true)} />
    </div>
  )
}
