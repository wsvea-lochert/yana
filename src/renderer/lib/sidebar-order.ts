import type { NoteMetadata } from '@shared/types/note'
import type { Folder } from '@shared/types/folder'
import { sortNotes } from '@shared/utils/sort'

/**
 * Returns notes in the same order as the sidebar displays them:
 * root notes (sorted by modified desc) first, then folder notes in folder sort order.
 */
export function getSidebarOrderedNotes(
  notes: readonly NoteMetadata[],
  folders: readonly Folder[]
): readonly NoteMetadata[] {
  const folderIds = new Set(folders.map((f) => f.id))
  const rootNotes: NoteMetadata[] = []
  const folderGroups = new Map<string, NoteMetadata[]>()

  for (const folder of folders) {
    folderGroups.set(folder.id, [])
  }

  for (const note of notes) {
    if (note.folder && folderIds.has(note.folder)) {
      folderGroups.get(note.folder)!.push(note)
    } else {
      rootNotes.push(note)
    }
  }

  const result: NoteMetadata[] = [...sortNotes([...rootNotes], 'modified', 'desc')]
  const sortedFolders = [...folders].sort((a, b) => a.sortOrder - b.sortOrder)

  for (const folder of sortedFolders) {
    const folderNotes = folderGroups.get(folder.id) ?? []
    result.push(...sortNotes([...folderNotes], 'modified', 'desc'))
  }

  return result
}
