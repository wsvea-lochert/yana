import type { DatabaseInstance } from '../db/database'
import { createNoteRepository, type NoteRepository } from '../db/repositories/note.repository'
import type { NoteMetadata } from '@shared/types/note'

export interface IndexService {
  fullReindex(notes: readonly NoteMetadata[]): void
  indexNote(metadata: NoteMetadata, content: string): void
  removeNote(id: string): void
  /** Expose the underlying repository for services that need delta queries. */
  readonly repository: NoteRepository
}

export function createIndexService(db: DatabaseInstance): IndexService {
  const repository = createNoteRepository(db)

  function indexNote(metadata: NoteMetadata, content: string): void {
    repository.upsert(metadata, content)
  }

  function removeNote(id: string): void {
    repository.delete(id)
  }

  function fullReindex(notes: readonly NoteMetadata[]): void {
    repository.bulkReindex(notes.map((n) => ({ metadata: n, content: '' })))
  }

  return { fullReindex, indexNote, removeNote, repository }
}
