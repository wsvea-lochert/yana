import type { ReactNode } from 'react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import type { Folder } from '@shared/types/folder'

interface SidebarNoteContextMenuProps {
  readonly children: ReactNode
  readonly currentFolder: string
  readonly allFolders: readonly Folder[]
  readonly onDelete: () => void
  readonly onShowInFinder: () => void
  readonly onMoveToFolder: (folderId: string) => void
}

export function SidebarNoteContextMenu({
  children,
  currentFolder,
  allFolders,
  onDelete,
  onShowInFinder,
  onMoveToFolder
}: SidebarNoteContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuSub>
          <ContextMenuSubTrigger>Move to folder</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-40">
            <ContextMenuItem disabled={currentFolder === ''} onClick={() => onMoveToFolder('')}>
              Root (no folder)
            </ContextMenuItem>
            {allFolders.length > 0 && <ContextMenuSeparator />}
            {allFolders.map((folder) => (
              <ContextMenuItem
                key={folder.id}
                disabled={currentFolder === folder.id}
                onClick={() => onMoveToFolder(folder.id)}
              >
                {folder.name}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onShowInFinder}>Show in Finder</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          Delete note
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
