import { useState, type ReactNode } from 'react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import { RenameFolderDialog } from './RenameFolderDialog'
import { useFolderStore } from '../../stores/folder.store'
import { useNoteStore } from '../../stores/note.store'
import type { Folder } from '@shared/types/folder'

interface FolderContextMenuProps {
  readonly children: ReactNode
  readonly folder: Folder
}

export function FolderContextMenu({ children, folder }: FolderContextMenuProps) {
  const [renameOpen, setRenameOpen] = useState(false)
  const deleteFolder = useFolderStore((s) => s.deleteFolder)
  const notes = useNoteStore((s) => s.notes)
  const moveNoteToFolder = useNoteStore((s) => s.moveNoteToFolder)

  async function handleDelete() {
    const folderNotes = notes.filter((n) => n.folder === folder.id)
    for (const note of folderNotes) {
      await moveNoteToFolder(note.id, '')
    }
    await deleteFolder(folder.id)
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-40">
          <ContextMenuItem onClick={() => setRenameOpen(true)}>Rename folder</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            Delete folder
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <RenameFolderDialog folder={folder} open={renameOpen} onOpenChange={setRenameOpen} />
    </>
  )
}
