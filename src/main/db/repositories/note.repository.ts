import { createHash } from 'crypto'
import type { DatabaseInstance } from '../database'
import type { NoteMetadata } from '@shared/types/note'

export interface NoteRow {
  readonly id: string
  readonly filename: string
  readonly title: string
  readonly created: string
  readonly modified: string
  readonly excerpt: string
  readonly wordCount: number
  readonly tags: readonly string[]
  readonly links: readonly string[]
  readonly rawContent: string
  readonly checksum: string
}

export interface NoteRepository {
  upsert(metadata: NoteMetadata, content: string): NoteRow
  findById(id: string): NoteRow | null
  findAll(): readonly NoteRow[]
  delete(id: string): void
  deleteAll(): void
  bulkReindex(rows: readonly { metadata: NoteMetadata; content: string }[]): void
  findByChecksum(checksum: string): NoteRow | null
}

function computeChecksum(content: string): string {
  return createHash('sha1').update(content).digest('hex')
}

function rowToNote(row: Record<string, unknown>): NoteRow {
  return {
    id: row.id as string,
    filename: row.filename as string,
    title: row.title as string,
    created: row.created as string,
    modified: row.modified as string,
    excerpt: (row.excerpt as string) ?? '',
    wordCount: (row.word_count as number) ?? 0,
    tags: safeParseJson(row.tags as string, []),
    links: safeParseJson(row.links as string, []),
    rawContent: (row.raw_content as string) ?? '',
    checksum: (row.checksum as string) ?? ''
  }
}

function safeParseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function createNoteRepository(db: DatabaseInstance): NoteRepository {
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO notes
      (id, filename, title, created, modified, excerpt, word_count, tags, links, raw_content, checksum)
    VALUES
      (@id, @filename, @title, @created, @modified, @excerpt, @wordCount, @tags, @links, @rawContent, @checksum)
  `)

  const selectByIdStmt = db.prepare('SELECT * FROM notes WHERE id = ?')
  const selectAllStmt = db.prepare('SELECT * FROM notes')
  const selectByChecksumStmt = db.prepare('SELECT * FROM notes WHERE checksum = ?')
  const deleteStmt = db.prepare('DELETE FROM notes WHERE id = ?')

  function upsert(metadata: NoteMetadata, content: string): NoteRow {
    const checksum = computeChecksum(content)
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
      rawContent: content,
      checksum
    })
    return {
      id: metadata.id,
      filename: metadata.filename,
      title: metadata.title,
      created: metadata.created,
      modified: metadata.modified,
      excerpt: metadata.excerpt,
      wordCount: metadata.wordCount,
      tags: metadata.tags,
      links: [],
      rawContent: content,
      checksum
    }
  }

  function findById(id: string): NoteRow | null {
    const row = selectByIdStmt.get(id) as Record<string, unknown> | undefined
    return row ? rowToNote(row) : null
  }

  function findAll(): readonly NoteRow[] {
    const rows = selectAllStmt.all() as Record<string, unknown>[]
    return rows.map(rowToNote)
  }

  function findByChecksum(checksum: string): NoteRow | null {
    const row = selectByChecksumStmt.get(checksum) as Record<string, unknown> | undefined
    return row ? rowToNote(row) : null
  }

  function deleteById(id: string): void {
    deleteStmt.run(id)
  }

  function deleteAll(): void {
    db.exec('DELETE FROM notes')
  }

  function bulkReindex(
    rows: readonly { metadata: NoteMetadata; content: string }[]
  ): void {
    db.transaction(() => {
      deleteAll()
      for (const { metadata, content } of rows) {
        upsert(metadata, content)
      }
    })()
  }

  return {
    upsert,
    findById,
    findAll,
    findByChecksum,
    delete: deleteById,
    deleteAll,
    bulkReindex
  }
}
