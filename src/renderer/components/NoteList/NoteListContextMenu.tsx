import { Trash2, FolderOpen } from 'lucide-react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger
} from '@/components/ui/context-menu'

interface NoteListContextMenuProps {
  readonly onDelete: () => void
  readonly onShowInFinder: () => void
  readonly children: React.ReactNode
}

const isMac = navigator.platform.includes('Mac')

export function NoteListContextMenu({
  onDelete,
  onShowInFinder,
  children
}: NoteListContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="block">
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuGroup>
          <ContextMenuItem className="gap-2" onClick={onShowInFinder}>
            <FolderOpen className="h-4 w-4" />
            {isMac ? 'Show in Finder' : 'Show in Explorer'}
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
            Delete note
            <ContextMenuShortcut>{isMac ? '\u2318' : 'Ctrl'} + {'\u232B'}</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  )
}
