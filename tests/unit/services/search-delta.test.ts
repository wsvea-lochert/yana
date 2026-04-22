import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createInMemoryDatabase, type DatabaseInstance } from '@main/db/database'
import { runMigrations } from '@main/db/migrations'
import { createSearchService, type SearchService } from '@main/services/search.service'
import type { NoteMetadata } from '@shared/types/note'

function makeMeta(id: string, title: string): NoteMetadata {
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

describe('searchService.applyDelta', () => {
  let db: DatabaseInstance
  let service: SearchService

  beforeEach(() => {
    db = createInMemoryDatabase()
    runMigrations(db)
    service = createSearchService(db)
  })

  afterEach(() => {
    db.close()
  })

  it('falls back to full rebuild when no prior index', () => {
    service.applyDelta({
      upserts: [makeMeta('a', 'Alpha')],
      removals: []
    })
    expect(service.searchTitles('Alpha').map((r) => r.id)).toEqual(['a'])
  })

  it('adds new notes incrementally', () => {
    service.rebuildFuseIndex([makeMeta('a', 'Alpha')])
    service.applyDelta({ upserts: [makeMeta('b', 'Bravo')], removals: [] })
    expect(service.searchTitles('Bravo').map((r) => r.id)).toEqual(['b'])
    expect(service.searchTitles('Alpha').map((r) => r.id)).toEqual(['a'])
  })

  it('updates existing notes via upsert', () => {
    service.rebuildFuseIndex([makeMeta('a', 'Alpha')])
    service.applyDelta({ upserts: [makeMeta('a', 'Zeta')], removals: [] })
    expect(service.searchTitles('Zeta').map((r) => r.id)).toEqual(['a'])
    expect(service.searchTitles('Alpha').length).toBe(0)
  })

  it('removes notes by id', () => {
    service.rebuildFuseIndex([makeMeta('a', 'Alpha'), makeMeta('b', 'Bravo')])
    service.applyDelta({ upserts: [], removals: ['a'] })
    expect(service.searchTitles('Alpha').length).toBe(0)
    expect(service.searchTitles('Bravo').map((r) => r.id)).toEqual(['b'])
  })
})
