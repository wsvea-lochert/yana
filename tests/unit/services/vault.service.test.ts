import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, readFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { createVaultService } from '@main/services/vault.service'

describe('VaultService', () => {
  let vaultPath: string
  let service: ReturnType<typeof createVaultService>

  beforeEach(() => {
    vaultPath = mkdtempSync(join(tmpdir(), 'quicknote-test-'))
    service = createVaultService(vaultPath)
  })

  afterEach(() => {
    service.stopWatching()
    rmSync(vaultPath, { recursive: true, force: true })
  })

  describe('createNote', () => {
    it('creates a note with frontmatter', async () => {
      const result = await service.createNote({
        title: 'Test Note',
        content: 'Hello world',
        tags: ['test']
      })

      expect(result.title).toBe('Test Note')
      expect(result.id).toBe('test-note')
      expect(result.filename).toBe('test-note.md')
      expect(result.tags).toEqual(['test'])

      const fileContent = readFileSync(join(vaultPath, 'test-note.md'), 'utf-8')
      expect(fileContent).toContain('title: Test Note')
      expect(fileContent).toContain('Hello world')
    })

    it('creates a note with minimal input', async () => {
      const result = await service.createNote({ title: 'Minimal' })
      expect(result.title).toBe('Minimal')
      expect(result.wordCount).toBe(0)
    })

    it('rejects empty title', async () => {
      await expect(service.createNote({ title: '' })).rejects.toThrow()
    })
  })

  describe('getNote', () => {
    it('returns null for non-existent note', async () => {
      const result = await service.getNote('nonexistent')
      expect(result).toBeNull()
    })

    it('returns full note after creation', async () => {
      await service.createNote({ title: 'Fetch Me', content: 'Body text' })
      const note = await service.getNote('fetch-me')

      expect(note).not.toBeNull()
      expect(note!.frontmatter.title).toBe('Fetch Me')
      expect(note!.content).toBe('Body text')
    })
  })

  describe('listNotes', () => {
    it('returns empty array for empty vault', async () => {
      const notes = await service.listNotes()
      expect(notes).toEqual([])
    })

    it('returns all notes', async () => {
      await service.createNote({ title: 'Note One' })
      await service.createNote({ title: 'Note Two' })

      const notes = await service.listNotes()
      expect(notes).toHaveLength(2)
    })
  })

  describe('updateNote', () => {
    it('updates note content', async () => {
      await service.createNote({ title: 'Update Me', content: 'Original' })
      const updated = await service.updateNote({
        id: 'update-me',
        content: 'Modified'
      })

      expect(updated.title).toBe('Update Me')

      const note = await service.getNote('update-me')
      expect(note!.content).toBe('Modified')
    })

    it('updates note title', async () => {
      await service.createNote({ title: 'Old Title' })
      const updated = await service.updateNote({
        id: 'old-title',
        title: 'New Title'
      })
      expect(updated.title).toBe('New Title')
    })

    it('throws for non-existent note', async () => {
      await expect(service.updateNote({ id: 'missing', content: 'x' })).rejects.toThrow(
        'Note not found'
      )
    })
  })

  describe('deleteNote', () => {
    it('removes the file', async () => {
      await service.createNote({ title: 'Delete Me' })
      await service.deleteNote('delete-me')

      const notes = await service.listNotes()
      expect(notes).toHaveLength(0)
    })

    it('does not throw for non-existent note', async () => {
      await expect(service.deleteNote('nonexistent')).resolves.toBeUndefined()
    })
  })

  describe('wiki links extraction', () => {
    it('extracts wiki links from content', async () => {
      await service.createNote({
        title: 'Linking Note',
        content: 'See [[other-note]] and [[another|display text]]'
      })
      const note = await service.getNote('linking-note')
      expect(note!.links).toEqual(['other-note', 'another'])
    })
  })
})
