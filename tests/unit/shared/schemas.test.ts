import { describe, it, expect } from 'vitest'
import { CreateNoteInputSchema, UpdateNoteInputSchema } from '@shared/schemas/note.schema'
import { SearchQuerySchema } from '@shared/schemas/search.schema'
import { AppConfigSchema } from '@shared/schemas/config.schema'

describe('CreateNoteInputSchema', () => {
  it('accepts valid input', () => {
    const result = CreateNoteInputSchema.parse({
      title: 'My Note',
      content: 'Hello world',
      tags: ['test']
    })
    expect(result.title).toBe('My Note')
  })

  it('accepts minimal input', () => {
    const result = CreateNoteInputSchema.parse({ title: 'Note' })
    expect(result.title).toBe('Note')
    expect(result.content).toBeUndefined()
  })

  it('rejects empty title', () => {
    expect(() => CreateNoteInputSchema.parse({ title: '' })).toThrow()
  })

  it('rejects title over 255 characters', () => {
    expect(() => CreateNoteInputSchema.parse({ title: 'a'.repeat(256) })).toThrow()
  })

  it('rejects empty tag strings', () => {
    expect(() => CreateNoteInputSchema.parse({ title: 'Note', tags: [''] })).toThrow()
  })
})

describe('UpdateNoteInputSchema', () => {
  it('accepts valid input', () => {
    const result = UpdateNoteInputSchema.parse({
      id: 'note-1',
      title: 'Updated',
      content: 'New content'
    })
    expect(result.id).toBe('note-1')
  })

  it('requires id', () => {
    expect(() => UpdateNoteInputSchema.parse({ title: 'Updated' })).toThrow()
  })

  it('rejects empty id', () => {
    expect(() => UpdateNoteInputSchema.parse({ id: '' })).toThrow()
  })

  it('allows partial updates', () => {
    const result = UpdateNoteInputSchema.parse({ id: 'note-1' })
    expect(result.title).toBeUndefined()
    expect(result.content).toBeUndefined()
  })
})

describe('SearchQuerySchema', () => {
  it('accepts valid query', () => {
    const result = SearchQuerySchema.parse({ term: 'test', limit: 10 })
    expect(result.term).toBe('test')
    expect(result.limit).toBe(10)
  })

  it('rejects empty term', () => {
    expect(() => SearchQuerySchema.parse({ term: '' })).toThrow()
  })

  it('rejects limit over 100', () => {
    expect(() => SearchQuerySchema.parse({ term: 'test', limit: 101 })).toThrow()
  })

  it('rejects limit of 0', () => {
    expect(() => SearchQuerySchema.parse({ term: 'test', limit: 0 })).toThrow()
  })

  it('accepts tags filter', () => {
    const result = SearchQuerySchema.parse({ term: 'test', tags: ['js', 'ts'] })
    expect(result.tags).toEqual(['js', 'ts'])
  })
})

describe('AppConfigSchema', () => {
  it('accepts valid config', () => {
    const result = AppConfigSchema.parse({
      vaultPath: '/home/user/notes',
      theme: 'dark',
      hotkey: 'Alt+Shift+Space',
      newNoteHotkey: 'CmdOrCtrl+Shift+N'
    })
    expect(result.theme).toBe('dark')
  })

  it('rejects invalid theme', () => {
    expect(() =>
      AppConfigSchema.parse({
        vaultPath: '/notes',
        theme: 'blue',
        hotkey: 'Ctrl+Space',
        newNoteHotkey: 'Ctrl+N'
      })
    ).toThrow()
  })

  it('accepts optional fontSize', () => {
    const result = AppConfigSchema.parse({
      vaultPath: '/notes',
      theme: 'light',
      hotkey: 'Ctrl+Space',
      newNoteHotkey: 'Ctrl+N',
      fontSize: 16
    })
    expect(result.fontSize).toBe(16)
  })
})
