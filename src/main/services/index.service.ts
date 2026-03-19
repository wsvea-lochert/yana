import type { DatabaseInstance } from '../db/database'
import type { NoteMetadata } from '@shared/types/note'

export interface IndexService {
  fullReindex(notes: readonly NoteMetadata[]): void
  indexNote(metadata: NoteMetadata, content: string): void
  removeNote(id: string): void
}

export function createIndexService(db: DatabaseInstance): IndexService {
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO notes (id, filename, title, created, modified, excerpt, word_count, tags, links, raw_content)
    VALUES (@id, @filename, @title, @created, @modified, @excerpt, @wordCount, @tags, @links, @rawContent)
  `)

  const deleteStmt = db.prepare('DELETE FROM notes WHERE id = ?')

  function indexNote(metadata: NoteMetadata, content: string): void {
    insertStmt.run({
      id: metadata.id,
      filename: metadata.filename,
      title: metadata.title,
      created: metadata.created,
      modified: metadata.modified,
      excerpt: metadata.excerpt,
      wordCount: metadata.wordCount,
      tags: JSON.stringify(metadata.tags),
      links: '[]',
      rawContent: content
    })
  }

  function removeNote(id: string): void {
    deleteStmt.run(id)
  }

  function fullReindex(notes: readonly NoteMetadata[]): void {
    db.transaction(() => {
      db.exec('DELETE FROM notes')
      for (const note of notes) {
        indexNote(note, '')
      }
    })()
  }

  return { fullReindex, indexNote, removeNote }
}
