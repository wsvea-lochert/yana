import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockApi } from '../../mocks/api.mock'

const mockApi = createMockApi()

vi.stubGlobal('window', { api: mockApi })

// Must import after stubbing window.api
const { useNoteStore } = await import('@renderer/stores/note.store')

describe('NoteStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useNoteStore.setState({
      notes: [],
      activeNoteId: null,
      activeNote: null,
      isLoading: false,
      error: null
    })
  })

  describe('loadNotes', () => {
    it('fetches notes and sets them in state', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          filename: 'note-1.md',
          title: 'First Note',
          created: '2026-01-01T00:00:00.000Z',
          modified: '2026-01-01T00:00:00.000Z',
          tags: ['test'],
          excerpt: 'Hello',
          wordCount: 1
        }
      ]
      vi.mocked(mockApi.notes.list).mockResolvedValueOnce(mockNotes)

      await useNoteStore.getState().loadNotes()

      expect(mockApi.notes.list).toHaveBeenCalledOnce()
      expect(useNoteStore.getState().notes).toEqual(mockNotes)
      expect(useNoteStore.getState().isLoading).toBe(false)
    })

    it('sets error on failure', async () => {
      vi.mocked(mockApi.notes.list).mockRejectedValueOnce(new Error('Network error'))

      await useNoteStore.getState().loadNotes()

      expect(useNoteStore.getState().error).toBe('Network error')
      expect(useNoteStore.getState().isLoading).toBe(false)
    })
  })

  describe('selectNote', () => {
    it('fetches note and sets active', async () => {
      const mockNote = {
        id: 'note-1',
        filename: 'note-1.md',
        frontmatter: {
          title: 'Test',
          created: '2026-01-01T00:00:00.000Z',
          modified: '2026-01-01T00:00:00.000Z',
          tags: [],
          aliases: []
        },
        content: 'Hello',
        rawContent: '---\ntitle: Test\n---\nHello',
        links: [],
        backlinks: []
      }
      vi.mocked(mockApi.notes.get).mockResolvedValueOnce(mockNote)

      await useNoteStore.getState().selectNote('note-1')

      expect(useNoteStore.getState().activeNoteId).toBe('note-1')
      expect(useNoteStore.getState().activeNote).toEqual(mockNote)
    })
  })

  describe('createNote', () => {
    it('creates note and prepends to list', async () => {
      const existing = {
        id: 'old',
        filename: 'old.md',
        title: 'Old Note',
        created: '2026-01-01T00:00:00.000Z',
        modified: '2026-01-01T00:00:00.000Z',
        tags: [],
        excerpt: '',
        wordCount: 0
      }
      useNoteStore.setState({ notes: [existing] })

      const created = {
        id: 'new-note',
        filename: 'new-note.md',
        title: 'New Note',
        created: '2026-01-01T00:00:00.000Z',
        modified: '2026-01-01T00:00:00.000Z',
        tags: [],
        excerpt: '',
        wordCount: 0
      }
      vi.mocked(mockApi.notes.create).mockResolvedValueOnce(created)

      const result = await useNoteStore.getState().createNote({ title: 'New Note' })

      expect(result).toEqual(created)
      expect(useNoteStore.getState().notes).toHaveLength(2)
      expect(useNoteStore.getState().notes[0].id).toBe('new-note')
    })
  })

  describe('deleteNote', () => {
    it('removes note from state', async () => {
      const notes = [
        {
          id: 'keep',
          filename: 'keep.md',
          title: 'Keep',
          created: '2026-01-01T00:00:00.000Z',
          modified: '2026-01-01T00:00:00.000Z',
          tags: [],
          excerpt: '',
          wordCount: 0
        },
        {
          id: 'delete-me',
          filename: 'delete-me.md',
          title: 'Delete',
          created: '2026-01-01T00:00:00.000Z',
          modified: '2026-01-01T00:00:00.000Z',
          tags: [],
          excerpt: '',
          wordCount: 0
        }
      ]
      useNoteStore.setState({ notes })

      await useNoteStore.getState().deleteNote('delete-me')

      expect(useNoteStore.getState().notes).toHaveLength(1)
      expect(useNoteStore.getState().notes[0].id).toBe('keep')
    })

    it('clears active note if deleted', async () => {
      useNoteStore.setState({
        activeNoteId: 'del',
        activeNote: { id: 'del' } as never,
        notes: [
          {
            id: 'del',
            filename: 'del.md',
            title: 'Del',
            created: '2026-01-01T00:00:00.000Z',
            modified: '2026-01-01T00:00:00.000Z',
            tags: [],
            excerpt: '',
            wordCount: 0
          }
        ]
      })

      await useNoteStore.getState().deleteNote('del')

      expect(useNoteStore.getState().activeNoteId).toBeNull()
      expect(useNoteStore.getState().activeNote).toBeNull()
    })
  })
})
