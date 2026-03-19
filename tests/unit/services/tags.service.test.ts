import { describe, it, expect } from 'vitest'
import { createTagsService } from '@main/services/tags.service'
import type { NoteMetadata } from '@shared/types/note'

function makeNote(overrides: Partial<NoteMetadata> = {}): NoteMetadata {
  return {
    id: 'test',
    filename: 'test.md',
    title: 'Test',
    created: '2026-01-01T00:00:00.000Z',
    modified: '2026-01-01T00:00:00.000Z',
    tags: [],
    excerpt: '',
    wordCount: 0,
    ...overrides
  }
}

describe('TagsService', () => {
  it('extracts inline tags', () => {
    const service = createTagsService()
    const tags = service.extractInlineTags('Hello #javascript and #typescript')
    expect(tags).toEqual(['javascript', 'typescript'])
  })

  it('deduplicates inline tags', () => {
    const service = createTagsService()
    const tags = service.extractInlineTags('#js and #js again')
    expect(tags).toEqual(['js'])
  })

  it('ignores hash in URLs and numbers', () => {
    const service = createTagsService()
    const tags = service.extractInlineTags('See https://example.com#section and issue #123')
    expect(tags).not.toContain('section')
    expect(tags).toEqual([])
  })

  it('getAllTags returns sorted unique tags', () => {
    const service = createTagsService()
    const notes = [
      makeNote({ tags: ['TypeScript', 'React'] }),
      makeNote({ id: 'n2', tags: ['react', 'CSS'] })
    ]
    const tags = service.getAllTags(notes)
    expect(tags).toEqual(['css', 'react', 'typescript'])
  })

  it('getNotesForTag filters correctly', () => {
    const service = createTagsService()
    const notes = [
      makeNote({ id: 'a', tags: ['js'] }),
      makeNote({ id: 'b', tags: ['ts'] }),
      makeNote({ id: 'c', tags: ['js', 'ts'] })
    ]
    const jsNotes = service.getNotesForTag(notes, 'js')
    expect(jsNotes.map((n) => n.id)).toEqual(['a', 'c'])
  })
})
