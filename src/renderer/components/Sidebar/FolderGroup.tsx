import { ChevronRight } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { SidebarNoteItem } from './SidebarNoteItem'
import { SidebarNoteContextMenu } from './SidebarNoteContextMenu'
import { FolderContextMenu } from './FolderContextMenu'
import type { NoteMetadata } from '@shared/types/note'
import type { Folder } from '@shared/types/folder'
import { cn } from '@/lib/utils'

interface FolderGroupProps {
  readonly folder: Folder
  readonly notes: readonly NoteMetadata[]
  readonly activeNoteId: string | null
  readonly isCollapsed: boolean
  readonly onToggleCollapsed: () => void
  readonly onSelectNote: (id: string) => void
  readonly onDeleteNote: (id: string) => void
  readonly onMoveNote: (noteId: string, folder: string) => void
  readonly onShowInFinder: (noteId: string) => void
  readonly allFolders: readonly Folder[]
}

export function FolderGroup({
  folder,
  notes,
  activeNoteId,
  isCollapsed,
  onToggleCollapsed,
  onSelectNote,
  onDeleteNote,
  onMoveNote,
  onShowInFinder,
  allFolders
}: FolderGroupProps) {
  return (
    <Collapsible open={!isCollapsed} onOpenChange={onToggleCollapsed}>
      <FolderContextMenu folder={folder}>
        <CollapsibleTrigger className="flex items-center gap-1.5 w-full px-2 py-1 rounded-md text-sm font-semibold hover:bg-accent/60 transition-colors no-drag outline-none">
          <ChevronRight
            className={cn(
              'h-3.5 w-3.5 text-muted-foreground transition-transform',
              !isCollapsed && 'rotate-90'
            )}
          />
          <span className="truncate">{folder.name}</span>
          <span className="ml-auto text-[11px] text-muted-foreground/50 font-normal">
            {notes.length}
          </span>
        </CollapsibleTrigger>
      </FolderContextMenu>
      <CollapsibleContent>
        <div className="ml-1">
          {notes.map((note) => (
            <SidebarNoteContextMenu
              key={note.id}
              noteId={note.id}
              currentFolder={note.folder}
              allFolders={allFolders}
              onDelete={() => onDeleteNote(note.id)}
              onShowInFinder={() => onShowInFinder(note.id)}
              onMoveToFolder={(folderId) => onMoveNote(note.id, folderId)}
            >
              <SidebarNoteItem
                note={note}
                isActive={note.id === activeNoteId}
                isIndented
                onClick={() => onSelectNote(note.id)}
              />
            </SidebarNoteContextMenu>
          ))}
          {notes.length === 0 && (
            <div className="pl-7 py-1 text-xs text-muted-foreground/50">Empty folder</div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
