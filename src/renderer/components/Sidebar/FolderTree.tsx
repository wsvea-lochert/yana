import { useMemo, useState } from 'react'
import type { NoteMetadata } from '@shared/types/note'
import type { Folder } from '@shared/types/folder'
import { FolderGroup } from './FolderGroup'
import { SidebarNoteItem } from './SidebarNoteItem'
import { SidebarNoteContextMenu } from './SidebarNoteContextMenu'
import { sortNotes } from '@shared/utils/sort'
import { cn } from '@/lib/utils'

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
  const folderIds = new Set(folders.map((f) => f.id))

  const initial = {
    groups: new Map<string, readonly NoteMetadata[]>(folders.map((f) => [f.id, []])),
    root: [] as readonly NoteMetadata[]
  }

  const result = notes.reduce((acc, note) => {
    if (note.folder && folderIds.has(note.folder)) {
      const existing = acc.groups.get(note.folder) ?? []
      return {
        ...acc,
        groups: new Map([...acc.groups, [note.folder, [...existing, note]]])
      }
    }
    return { ...acc, root: [...acc.root, note] }
  }, initial)

  return {
    folderGroups: result.groups,
    rootNotes: sortNotes([...result.root], 'modified', 'desc')
  }
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

  const [isRootDragOver, setIsRootDragOver] = useState(false)

  return (
    <div className="space-y-0.5">
      {/* Root notes — drop zone to move notes out of folders */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
          setIsRootDragOver(true)
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsRootDragOver(false)
          }
        }}
        onDrop={(e) => {
          e.preventDefault()
          setIsRootDragOver(false)
          const noteId = e.dataTransfer.getData('text/plain')
          if (noteId && !rootNotes.some((n) => n.id === noteId)) {
            onMoveNote(noteId, '')
          }
        }}
        className={cn(
          'rounded-md transition-colors',
          isRootDragOver && 'ring-2 ring-primary/50 bg-primary/10 min-h-[2rem]'
        )}
      >
        {rootNotes.map((note, i) => (
          <SidebarNoteContextMenu
            key={note.id}
            currentFolder=""
            allFolders={folders}
            onDelete={() => onDeleteNote(note.id)}
            onShowInFinder={() => onShowInFinder(note.id)}
            onMoveToFolder={(folderId) => onMoveNote(note.id, folderId)}
          >
            <SidebarNoteItem
              note={note}
              index={i}
              isActive={note.id === activeNoteId}
              onClick={() => onSelectNote(note.id)}
            />
          </SidebarNoteContextMenu>
        ))}
      </div>

      {/* Folders */}
      {(() => {
        let globalIndex = rootNotes.length
        return sortedFolders.map((folder) => {
          const folderNotes = folderGroups.get(folder.id) ?? []
          const sorted = sortNotes([...folderNotes], 'modified', 'desc')
          const startIndex = globalIndex
          globalIndex += sorted.length

          return (
            <FolderGroup
              key={folder.id}
              folder={folder}
              notes={sorted}
              startIndex={startIndex}
              activeNoteId={activeNoteId}
              isCollapsed={collapsedFolderIds.has(folder.id)}
              onToggleCollapsed={() => onToggleCollapsed(folder.id)}
              onSelectNote={onSelectNote}
              onDeleteNote={onDeleteNote}
              onMoveNote={onMoveNote}
              onShowInFinder={onShowInFinder}
              onDropNote={onMoveNote}
              allFolders={folders}
            />
          )
        })
      })()}

      {rootNotes.length === 0 && folders.length === 0 && (
        <div className="px-3 py-8 text-center text-sm text-muted-foreground">No notes yet</div>
      )}
    </div>
  )
}
