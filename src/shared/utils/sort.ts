import type { NoteMetadata } from '../types/note'

type SortBy = 'modified' | 'created' | 'title'
type SortDirection = 'asc' | 'desc'

export function sortNotes(
  notes: readonly NoteMetadata[],
  sortBy: SortBy,
  direction: SortDirection
): readonly NoteMetadata[] {
  const sorted = [...notes].sort((a, b) => {
    let comparison: number
    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title)
        break
      case 'created':
        comparison = new Date(a.created).getTime() - new Date(b.created).getTime()
        break
      case 'modified':
      default:
        comparison = new Date(a.modified).getTime() - new Date(b.modified).getTime()
        break
    }
    return direction === 'asc' ? comparison : -comparison
  })
  return sorted
}
