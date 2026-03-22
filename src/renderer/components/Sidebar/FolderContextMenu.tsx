import { useState, type ReactNode } from 'react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import { RenameFolderDialog } from './RenameFolderDialog'
import { DeleteFolderDialog } from './DeleteFolderDialog'
import { useFolderStore } from '../../stores/folder.store'
import { useNoteStore } from '../../stores/note.store'
import type { Folder } from '@shared/types/folder'

interface FolderContextMenuProps {
  readonly children: ReactNode
  readonly folder: Folder
}

export function FolderContextMenu({ children, folder }: FolderContextMenuProps) {
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const deleteFolder = useFolderStore((s) => s.deleteFolder)
  const notes = useNoteStore((s) => s.notes)
  const deleteNote = useNoteStore((s) => s.deleteNote)
  const createNote = useNoteStore((s) => s.createNote)
  const selectNote = useNoteStore((s) => s.selectNote)
  const moveNoteToFolder = useNoteStore((s) => s.moveNoteToFolder)

  const folderNotes = notes.filter((n) => n.folder === folder.id)

  async function handleNewNote() {
    try {
      const metadata = await createNote({ title: 'Untitled', folder: folder.id })
      await selectNote(metadata.id)
    } catch {
      // Errors already shown via toast in the stores
    }
  }

  async function handleDeleteKeepNotes() {
    try {
      await Promise.all(folderNotes.map((note) => moveNoteToFolder(note.id, '')))
      await deleteFolder(folder.id)
    } catch {
      // Errors already shown via toast in the stores
    }
  }

  async function handleDeleteWithNotes() {
    try {
      await Promise.all(folderNotes.map((note) => deleteNote(note.id)))
      await deleteFolder(folder.id)
    } catch {
      // Errors already shown via toast in the stores
    }
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-40">
          <ContextMenuItem onClick={handleNewNote}>New note</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => setRenameOpen(true)}>Rename folder</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            Delete folder
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <RenameFolderDialog folder={folder} open={renameOpen} onOpenChange={setRenameOpen} />
      <DeleteFolderDialog
        folder={folder}
        noteCount={folderNotes.length}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleteKeepNotes={handleDeleteKeepNotes}
        onDeleteWithNotes={handleDeleteWithNotes}
      />
    </>
  )
}
