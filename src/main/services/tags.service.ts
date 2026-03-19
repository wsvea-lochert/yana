import type { NoteMetadata } from '@shared/types/note'

const INLINE_TAG_REGEX = /(?:^|\s)#([a-zA-Z][\w-]*)/g

export interface TagsService {
  getAllTags(notes: readonly NoteMetadata[]): readonly string[]
  getNotesForTag(notes: readonly NoteMetadata[], tag: string): readonly NoteMetadata[]
  extractInlineTags(content: string): readonly string[]
}

export function createTagsService(): TagsService {
  function extractInlineTags(content: string): readonly string[] {
    const tags: string[] = []
    let match: RegExpExecArray | null
    const regex = new RegExp(INLINE_TAG_REGEX.source, INLINE_TAG_REGEX.flags)
    while ((match = regex.exec(content)) !== null) {
      tags.push(match[1].toLowerCase())
    }
    return [...new Set(tags)]
  }

  function getAllTags(notes: readonly NoteMetadata[]): readonly string[] {
    const tagSet = new Set<string>()
    for (const note of notes) {
      for (const tag of note.tags) {
        tagSet.add(tag.toLowerCase())
      }
    }
    return [...tagSet].sort()
  }

  function getNotesForTag(notes: readonly NoteMetadata[], tag: string): readonly NoteMetadata[] {
    const normalizedTag = tag.toLowerCase()
    return notes.filter((note) => note.tags.some((t) => t.toLowerCase() === normalizedTag))
  }

  return { getAllTags, getNotesForTag, extractInlineTags }
}
