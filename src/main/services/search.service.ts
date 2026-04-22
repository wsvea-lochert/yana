import Fuse from 'fuse.js'
import type { DatabaseInstance } from '../db/database'
import type { NoteMetadata } from '@shared/types/note'
import type { SearchQuery, SearchResult, FtsResult } from '@shared/types/search'
import { SearchQuerySchema } from '@shared/schemas/search.schema'
import {
  MAX_SEARCH_RESULTS,
  MAX_OVERLAY_RESULTS,
  FUSE_THRESHOLD,
  EXCERPT_PREVIEW_LENGTH,
  QUICK_SEARCH_DEFAULT_LIMIT
} from '@shared/constants/defaults'
import { escapeFtsTerm } from './search-query'
import { createLogger } from '@shared/logger'

const searchLogger = createLogger('search.service')

export interface SearchDelta {
  readonly upserts: readonly NoteMetadata[]
  readonly removals: readonly string[]
}

export interface SearchService {
  searchContent(query: string, limit?: number): readonly SearchResult[]
  searchTitles(term: string, limit?: number): readonly SearchResult[]
  search(query: SearchQuery): readonly SearchResult[]
  quickSearch(term: string): readonly SearchResult[]
  rebuildFuseIndex(notes: readonly NoteMetadata[]): void
  /** Incrementally update the Fuse index. Requires a previous rebuild. */
  applyDelta(delta: SearchDelta): void
}

function ftsResultToSearchResult(row: FtsResult): SearchResult {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.rawContent.slice(0, EXCERPT_PREVIEW_LENGTH),
    // FTS5 rank is negative by convention (lower = better); negate for a score
    score: Math.abs(row.rank),
    matchType: 'content',
    tags: safeParseTags(row.tags),
    modified: ''
  }
}

function safeParseTags(tagsJson: string): readonly string[] {
  try {
    return JSON.parse(tagsJson) as string[]
  } catch {
    return []
  }
}

export function createSearchService(db: DatabaseInstance): SearchService {
  let fuseInstance: Fuse<NoteMetadata> | null = null
  let noteIndex: Map<string, NoteMetadata> = new Map()

  function rebuildFuseIndex(notes: readonly NoteMetadata[]): void {
    noteIndex = new Map(notes.map((n) => [n.id, n]))
    fuseInstance = new Fuse([...notes], {
      keys: [
        { name: 'title', weight: 2 },
        { name: 'tags', weight: 1 }
      ],
      threshold: FUSE_THRESHOLD,
      includeScore: true
    })
  }

  function applyDelta(delta: SearchDelta): void {
    if (!fuseInstance) {
      // No prior rebuild — fall back to full reindex from upserts alone
      rebuildFuseIndex(delta.upserts)
      return
    }
    for (const id of delta.removals) {
      noteIndex.delete(id)
      fuseInstance.remove((doc) => doc.id === id)
    }
    for (const note of delta.upserts) {
      if (noteIndex.has(note.id)) {
        fuseInstance.remove((doc) => doc.id === note.id)
      }
      noteIndex.set(note.id, note)
      fuseInstance.add(note)
    }
  }

  function searchContent(query: string, limit: number = MAX_SEARCH_RESULTS): readonly SearchResult[] {
    const ftsQuery = escapeFtsTerm(query)
    if (!ftsQuery) return []

    try {
      const rows = db
        .prepare(
          `SELECT notes.id, notes.title, notes.raw_content as rawContent, notes.tags, rank
           FROM notes_fts
           JOIN notes ON notes.rowid = notes_fts.rowid
           WHERE notes_fts MATCH ?
           ORDER BY rank
           LIMIT ?`
        )
        .all(ftsQuery, limit) as FtsResult[]

      return rows.map(ftsResultToSearchResult)
    } catch (error) {
      searchLogger.warn(`FTS query failed for "${query}"`, error)
      return []
    }
  }

  function searchTitles(
    term: string,
    limit: number = QUICK_SEARCH_DEFAULT_LIMIT
  ): readonly SearchResult[] {
    if (!fuseInstance || !term.trim()) return []

    const results = fuseInstance.search(term, { limit })
    return results.map((r) => ({
      id: r.item.id,
      title: r.item.title,
      excerpt: r.item.excerpt,
      score: 1 - (r.score ?? 0),
      matchType: 'title' as const,
      tags: r.item.tags,
      modified: r.item.modified
    }))
  }

  function search(query: SearchQuery): readonly SearchResult[] {
    const validated = SearchQuerySchema.parse(query)
    const limit = validated.limit ?? MAX_SEARCH_RESULTS

    const titleResults = searchTitles(validated.term, limit)
    const contentResults = searchContent(validated.term, limit)

    const seen = new Set<string>()
    const merged: SearchResult[] = []

    for (const result of titleResults) {
      if (!seen.has(result.id)) {
        seen.add(result.id)
        const contentMatch = contentResults.find((r) => r.id === result.id)
        merged.push(
          contentMatch
            ? { ...result, matchType: 'both', score: result.score * 1.5 }
            : result
        )
      }
    }

    for (const result of contentResults) {
      if (!seen.has(result.id)) {
        seen.add(result.id)
        merged.push(result)
      }
    }

    return merged.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  function quickSearch(term: string): readonly SearchResult[] {
    if (!term.trim()) return []
    return search({ term, limit: MAX_OVERLAY_RESULTS })
  }

  return { searchContent, searchTitles, search, quickSearch, rebuildFuseIndex, applyDelta }
}
