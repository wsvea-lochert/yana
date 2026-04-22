import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createInMemoryDatabase, type DatabaseInstance } from '@main/db/database'
import { runMigrations } from '@main/db/migrations'
import {
  createNoteRepository,
  type NoteRepository
} from '@main/db/repositories/note.repository'
import type { NoteMetadata } from '@shared/types/note'

function makeMetadata(id: string, title = `Title ${id}`): NoteMetadata {
  return {
    id,
    filename: `${id}.md`,
    title,
    created: '2026-04-22T10:00:00.000Z',
    modified: '2026-04-22T10:00:00.000Z',
    excerpt: '',
    wordCount: 0,
    tags: [],
    folder: ''
  }
}

describe('NoteRepository', () => {
  let db: DatabaseInstance
  let repo: NoteRepository

  beforeEach(() => {
    db = createInMemoryDatabase()
    runMigrations(db)
    repo = createNoteRepository(db)
  })

  afterEach(() => {
    db.close()
  })

  it('upsert stores a note with checksum', () => {
    const row = repo.upsert(makeMetadata('note-1'), 'hello')
    expect(row.id).toBe('note-1')
    expect(row.checksum).toMatch(/^[a-f0-9]{40}$/)
    expect(row.rawContent).toBe('hello')
  })

  it('findById retrieves stored note', () => {
    repo.upsert(makeMetadata('note-2'), 'content')
    const found = repo.findById('note-2')
    expect(found?.title).toBe('Title note-2')
  })

  it('findById returns null for missing id', () => {
    expect(repo.findById('missing')).toBeNull()
  })

  it('findByChecksum round-trips', () => {
    const row = repo.upsert(makeMetadata('note-3'), 'body')
    const found = repo.findByChecksum(row.checksum)
    expect(found?.id).toBe('note-3')
  })

  it('upsert with same id replaces row', () => {
    repo.upsert(makeMetadata('note-4', 'Original'), 'a')
    repo.upsert(makeMetadata('note-4', 'Updated'), 'b')
    const found = repo.findById('note-4')
    expect(found?.title).toBe('Updated')
    expect(found?.rawContent).toBe('b')
  })

  it('delete removes the row', () => {
    repo.upsert(makeMetadata('note-5'), 'x')
    repo.delete('note-5')
    expect(repo.findById('note-5')).toBeNull()
  })

  it('bulkReindex clears and refills', () => {
    repo.upsert(makeMetadata('old-1'), 'x')
    repo.bulkReindex([
      { metadata: makeMetadata('fresh-1'), content: '' },
      { metadata: makeMetadata('fresh-2'), content: '' }
    ])
    expect(repo.findById('old-1')).toBeNull()
    expect(repo.findAll().map((r) => r.id).sort()).toEqual(['fresh-1', 'fresh-2'])
  })

  it('different content yields different checksums', () => {
    const a = repo.upsert(makeMetadata('a'), 'hello')
    const b = repo.upsert(makeMetadata('b'), 'world')
    expect(a.checksum).not.toBe(b.checksum)
  })
})
