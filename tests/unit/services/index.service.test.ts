import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createInMemoryDatabase, type DatabaseInstance } from '@main/db/database'
import { runMigrations } from '@main/db/migrations'
import { createIndexService } from '@main/services/index.service'
import type { NoteMetadata } from '@shared/types/note'

function makeMeta(overrides: Partial<NoteMetadata> = {}): NoteMetadata {
  return {
    id: 'test',
    filename: 'test.md',
    title: 'Test Note',
    created: '2026-01-01T00:00:00.000Z',
    modified: '2026-01-01T00:00:00.000Z',
    tags: [],
    excerpt: 'An excerpt',
    wordCount: 10,
    folder: '',
    ...overrides
  }
}

describe('IndexService', () => {
  let db: DatabaseInstance
  let indexService: ReturnType<typeof createIndexService>

  beforeEach(() => {
    db = createInMemoryDatabase()
    runMigrations(db)
    indexService = createIndexService(db)
  })

  afterEach(() => {
    db.close()
  })

  it('indexes a note into SQLite', () => {
    indexService.indexNote(makeMeta({ id: 'hello', title: 'Hello' }), 'Hello world content')

    const row = db.prepare('SELECT * FROM notes WHERE id = ?').get('hello') as Record<string, unknown>
    expect(row).toBeTruthy()
    expect(row.title).toBe('Hello')
    expect(row.raw_content).toBe('Hello world content')
  })

  it('updates existing note on re-index', () => {
    indexService.indexNote(makeMeta({ id: 'n1', title: 'V1' }), 'version 1')
    indexService.indexNote(makeMeta({ id: 'n1', title: 'V2' }), 'version 2')

    const rows = db.prepare('SELECT * FROM notes WHERE id = ?').all('n1')
    expect(rows).toHaveLength(1)
    expect((rows[0] as Record<string, unknown>).title).toBe('V2')
  })

  it('removes a note', () => {
    indexService.indexNote(makeMeta({ id: 'rm' }), 'to remove')
    indexService.removeNote('rm')

    const row = db.prepare('SELECT * FROM notes WHERE id = ?').get('rm')
    expect(row).toBeUndefined()
  })

  it('full reindex clears and rebuilds', () => {
    indexService.indexNote(makeMeta({ id: 'old' }), 'old content')

    indexService.fullReindex([
      makeMeta({ id: 'new1', title: 'New 1' }),
      makeMeta({ id: 'new2', title: 'New 2' })
    ])

    const old = db.prepare('SELECT * FROM notes WHERE id = ?').get('old')
    expect(old).toBeUndefined()

    const all = db.prepare('SELECT * FROM notes').all()
    expect(all).toHaveLength(2)
  })

  it('FTS stays in sync after index', () => {
    indexService.indexNote(makeMeta({ id: 'fts-test' }), 'searchable content here')

    const fts = db
      .prepare("SELECT * FROM notes_fts WHERE notes_fts MATCH 'searchable'")
      .all()
    expect(fts).toHaveLength(1)
  })

  it('FTS stays in sync after remove', () => {
    indexService.indexNote(makeMeta({ id: 'fts-rm' }), 'unique findme text')
    indexService.removeNote('fts-rm')

    const fts = db
      .prepare("SELECT * FROM notes_fts WHERE notes_fts MATCH 'findme'")
      .all()
    expect(fts).toHaveLength(0)
  })
})
