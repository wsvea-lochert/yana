import { describe, it, expect } from 'vitest'
import { sortNotes } from '@shared/utils/sort'
import type { NoteMetadata } from '@shared/types/note'

const notes: readonly NoteMetadata[] = [
  {
    id: 'a',
    filename: 'a.md',
    title: 'Banana',
    created: '2026-01-01T00:00:00.000Z',
    modified: '2026-01-03T00:00:00.000Z',
    tags: [],
    excerpt: '',
    wordCount: 0
  },
  {
    id: 'b',
    filename: 'b.md',
    title: 'Apple',
    created: '2026-01-02T00:00:00.000Z',
    modified: '2026-01-01T00:00:00.000Z',
    tags: [],
    excerpt: '',
    wordCount: 0
  },
  {
    id: 'c',
    filename: 'c.md',
    title: 'Cherry',
    created: '2026-01-03T00:00:00.000Z',
    modified: '2026-01-02T00:00:00.000Z',
    tags: [],
    excerpt: '',
    wordCount: 0
  }
]

describe('sortNotes', () => {
  it('sorts by modified descending', () => {
    const result = sortNotes(notes, 'modified', 'desc')
    expect(result.map((n) => n.id)).toEqual(['a', 'c', 'b'])
  })

  it('sorts by modified ascending', () => {
    const result = sortNotes(notes, 'modified', 'asc')
    expect(result.map((n) => n.id)).toEqual(['b', 'c', 'a'])
  })

  it('sorts by created descending', () => {
    const result = sortNotes(notes, 'created', 'desc')
    expect(result.map((n) => n.id)).toEqual(['c', 'b', 'a'])
  })

  it('sorts by created ascending', () => {
    const result = sortNotes(notes, 'created', 'asc')
    expect(result.map((n) => n.id)).toEqual(['a', 'b', 'c'])
  })

  it('sorts by title ascending', () => {
    const result = sortNotes(notes, 'title', 'asc')
    expect(result.map((n) => n.id)).toEqual(['b', 'a', 'c'])
  })

  it('sorts by title descending', () => {
    const result = sortNotes(notes, 'title', 'desc')
    expect(result.map((n) => n.id)).toEqual(['c', 'a', 'b'])
  })

  it('does not mutate the original array', () => {
    const original = [...notes]
    sortNotes(notes, 'title', 'asc')
    expect(notes).toEqual(original)
  })
})
