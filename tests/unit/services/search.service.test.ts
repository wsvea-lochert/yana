import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createInMemoryDatabase, type DatabaseInstance } from '@main/db/database'
import { runMigrations } from '@main/db/migrations'
import { createIndexService } from '@main/services/index.service'
import { createSearchService } from '@main/services/search.service'
import type { NoteMetadata } from '@shared/types/note'

function makeMeta(id: string, title: string, tags: string[] = []): NoteMetadata {
  return {
    id,
    filename: `${id}.md`,
    title,
    created: '2026-01-01T00:00:00.000Z',
    modified: '2026-01-01T00:00:00.000Z',
    tags,
    excerpt: `Excerpt for ${title}`,
    wordCount: 50,
    folder: ''
  }
}

describe('SearchService', () => {
  let db: DatabaseInstance
  let searchService: ReturnType<typeof createSearchService>

  const notes: NoteMetadata[] = [
    makeMeta('architecture', 'Software Architecture Guide', ['engineering']),
    makeMeta('react-hooks', 'React Hooks Deep Dive', ['react', 'javascript']),
    makeMeta('typescript', 'TypeScript Best Practices', ['typescript']),
    makeMeta('testing', 'Testing Strategies', ['testing']),
    makeMeta('design-patterns', 'Design Patterns Overview', ['engineering']),
    makeMeta('graphql', 'GraphQL API Design', ['api', 'graphql']),
    makeMeta('docker', 'Docker Fundamentals', ['devops']),
    makeMeta('git-workflow', 'Git Workflow Guide', ['git']),
    makeMeta('css-grid', 'CSS Grid Layout', ['css', 'frontend']),
    makeMeta('performance', 'Performance Optimization', ['engineering'])
  ]

  beforeEach(() => {
    db = createInMemoryDatabase()
    runMigrations(db)
    const indexService = createIndexService(db)
    searchService = createSearchService(db)

    for (const note of notes) {
      indexService.indexNote(note, `Content about ${note.title}. ${note.tags.join(' ')}`)
    }
    searchService.rebuildFuseIndex(notes)
  })

  afterEach(() => {
    db.close()
  })

  describe('searchContent (FTS5)', () => {
    it('finds notes by content keyword', () => {
      const results = searchService.searchContent('architecture')
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].id).toBe('architecture')
    })

    it('returns empty for no matches', () => {
      const results = searchService.searchContent('nonexistentkeyword')
      expect(results).toHaveLength(0)
    })

    it('handles prefix search', () => {
      const results = searchService.searchContent('archit')
      expect(results.length).toBeGreaterThan(0)
    })
  })

  describe('searchTitles (Fuse.js)', () => {
    it('finds notes by fuzzy title match', () => {
      const results = searchService.searchTitles('archtecture')
      expect(results.length).toBeGreaterThan(0)
    })

    it('returns empty for no match', () => {
      const results = searchService.searchTitles('zzzzzzzzzzz')
      expect(results).toHaveLength(0)
    })

    it('respects limit', () => {
      const results = searchService.searchTitles('guide', 1)
      expect(results).toHaveLength(1)
    })
  })

  describe('search (combined)', () => {
    it('merges title and content results', () => {
      const results = searchService.search({ term: 'design' })
      expect(results.length).toBeGreaterThan(0)
    })

    it('validates input', () => {
      expect(() => searchService.search({ term: '' })).toThrow()
    })

    it('deduplicates results', () => {
      const results = searchService.search({ term: 'architecture' })
      const ids = results.map((r) => r.id)
      const uniqueIds = [...new Set(ids)]
      expect(ids).toEqual(uniqueIds)
    })
  })

  describe('quickSearch', () => {
    it('returns limited results', () => {
      const results = searchService.quickSearch('guide')
      expect(results.length).toBeLessThanOrEqual(7)
    })

    it('returns empty for empty term', () => {
      const results = searchService.quickSearch('')
      expect(results).toHaveLength(0)
    })
  })
})
