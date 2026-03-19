import { create } from 'zustand'
import type { NoteMetadata, Note, CreateNoteInput, UpdateNoteInput } from '@shared/types/note'
import { useToastStore } from './toast.store'

interface NoteState {
  readonly notes: readonly NoteMetadata[]
  readonly activeNoteId: string | null
  readonly activeNote: Note | null
  readonly isLoading: boolean
  readonly error: string | null
}

interface NoteActions {
  loadNotes: () => Promise<void>
  selectNote: (id: string) => Promise<void>
  createNote: (input: CreateNoteInput) => Promise<NoteMetadata>
  updateNote: (input: UpdateNoteInput) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  refreshFromVault: () => Promise<void>
}

export type NoteStore = NoteState & NoteActions

function showError(msg: string): void {
  useToastStore.getState().addToast(msg, 'error')
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  activeNoteId: null,
  activeNote: null,
  isLoading: false,
  error: null,

  loadNotes: async () => {
    set({ isLoading: true, error: null })
    try {
      const notes = await window.api.notes.list()
      set({ notes, isLoading: false })
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      set({ error: msg, isLoading: false })
      showError(`Failed to load notes: ${msg}`)
    }
  },

  selectNote: async (id: string) => {
    set({ activeNoteId: id, isLoading: true })
    window.api.config.set('activeNoteId', id).catch(() => {})
    try {
      const note = await window.api.notes.get(id)
      set({ activeNote: note, isLoading: false })
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      set({ error: msg, isLoading: false })
      showError(`Failed to load note: ${msg}`)
    }
  },

  createNote: async (input: CreateNoteInput) => {
    try {
      const metadata = await window.api.notes.create(input)
      const { notes } = get()
      set({ notes: [metadata, ...notes] })
      return metadata
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      showError(`Failed to create note: ${msg}`)
      throw error
    }
  },

  updateNote: async (input: UpdateNoteInput) => {
    try {
      await window.api.notes.update(input)
      const { activeNoteId } = get()
      if (activeNoteId === input.id) {
        const note = await window.api.notes.get(input.id)
        set({ activeNote: note })
      }
      await get().loadNotes()
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      showError(`Failed to update note: ${msg}`)
    }
  },

  deleteNote: async (id: string) => {
    try {
      await window.api.notes.delete(id)
      const { notes, activeNoteId } = get()
      set({
        notes: notes.filter((n) => n.id !== id),
        ...(activeNoteId === id ? { activeNoteId: null, activeNote: null } : {})
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      showError(`Failed to delete note: ${msg}`)
    }
  },

  refreshFromVault: async () => {
    await get().loadNotes()
    const { activeNoteId } = get()
    if (activeNoteId) {
      try {
        const note = await window.api.notes.get(activeNoteId)
        set({ activeNote: note })
      } catch {
        // Note may have been deleted externally
      }
    }
  }
}))
