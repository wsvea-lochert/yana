import { useMemo } from 'react'
import type { NoteMetadata } from '@shared/types/note'
import type { Folder } from '@shared/types/folder'
import { FolderGroup } from './FolderGroup'
import { SidebarNoteItem } from './SidebarNoteItem'
import { SidebarNoteContextMenu } from './SidebarNoteContextMenu'
import { sortNotes } from '@shared/utils/sort'

interface FolderTreeProps {
  readonly notes: readonly NoteMetadata[]
  readonly folders: readonly Folder[]
  readonly activeNoteId: string | null
  readonly collapsedFolderIds: ReadonlySet<string>
  readonly onToggleCollapsed: (id: string) => void
  readonly onSelectNote: (id: string) => void
  readonly onDeleteNote: (id: string) => void
  readonly onMoveNote: (noteId: string, folder: string) => void
  readonly onShowInFinder: (noteId: string) => void
}

function groupNotesByFolder(
  notes: readonly NoteMetadata[],
  folders: readonly Folder[]
): { folderGroups: Map<string, readonly NoteMetadata[]>; rootNotes: readonly NoteMetadata[] } {
  const folderGroups = new Map<string, NoteMetadata[]>()

  for (const folder of folders) {
    folderGroups.set(folder.id, [])
  }

  const rootNotes: NoteMetadata[] = []

  for (const note of notes) {
    if (note.folder && folderGroups.has(note.folder)) {
      folderGroups.get(note.folder)!.push(note)
    } else {
      rootNotes.push(note)
    }
  }

  return { folderGroups, rootNotes: sortNotes([...rootNotes], 'modified', 'desc') }
}

export function FolderTree({
  notes,
  folders,
  activeNoteId,
  collapsedFolderIds,
  onToggleCollapsed,
  onSelectNote,
  onDeleteNote,
  onMoveNote,
  onShowInFinder
}: FolderTreeProps) {
  const { folderGroups, rootNotes } = useMemo(
    () => groupNotesByFolder(notes, folders),
    [notes, folders]
  )

  const sortedFolders = useMemo(
    () => [...folders].sort((a, b) => a.sortOrder - b.sortOrder),
    [folders]
  )

  return (
    <div className="space-y-0.5">
      {/* Root notes first */}
      {rootNotes.map((note) => (
        <SidebarNoteContextMenu
          key={note.id}
          noteId={note.id}
          currentFolder=""
          allFolders={folders}
          onDelete={() => onDeleteNote(note.id)}
          onShowInFinder={() => onShowInFinder(note.id)}
          onMoveToFolder={(folderId) => onMoveNote(note.id, folderId)}
        >
          <SidebarNoteItem
            note={note}
            isActive={note.id === activeNoteId}
            onClick={() => onSelectNote(note.id)}
          />
        </SidebarNoteContextMenu>
      ))}

      {/* Folders */}
      {sortedFolders.map((folder) => {
        const folderNotes = folderGroups.get(folder.id) ?? []
        const sorted = sortNotes([...folderNotes], 'modified', 'desc')

        return (
          <FolderGroup
            key={folder.id}
            folder={folder}
            notes={sorted}
            activeNoteId={activeNoteId}
            isCollapsed={collapsedFolderIds.has(folder.id)}
            onToggleCollapsed={() => onToggleCollapsed(folder.id)}
            onSelectNote={onSelectNote}
            onDeleteNote={onDeleteNote}
            onMoveNote={onMoveNote}
            onShowInFinder={onShowInFinder}
            allFolders={folders}
          />
        )
      })}

      {rootNotes.length === 0 && folders.length === 0 && (
        <div className="px-3 py-8 text-center text-sm text-muted-foreground">No notes yet</div>
      )}
    </div>
  )
}
