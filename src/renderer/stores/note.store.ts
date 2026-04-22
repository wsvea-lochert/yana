import { create } from 'zustand'
import type { NoteMetadata, Note, CreateNoteInput, UpdateNoteInput } from '@shared/types/note'
import { ACTIVE_NOTE_PERSIST_DEBOUNCE_MS } from '@shared/constants/defaults'
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
  moveNoteToFolder: (noteId: string, folder: string) => Promise<void>
  refreshFromVault: () => Promise<void>
}

export type NoteStore = NoteState & NoteActions

function showError(msg: string): void {
  useToastStore.getState().addToast(msg, 'error')
}

// Debounce activeNoteId persistence to avoid a config:set per keystroke.
let persistActiveNoteTimer: ReturnType<typeof setTimeout> | null = null
function schedulePersistActiveNote(id: string): void {
  if (persistActiveNoteTimer) clearTimeout(persistActiveNoteTimer)
  persistActiveNoteTimer = setTimeout(() => {
    window.api.config.set('activeNoteId', id).catch((error: unknown) => {
      // Non-critical: persistence of active note is cosmetic
      showError(
        `Could not save active note: ${error instanceof Error ? error.message : String(error)}`
      )
    })
  }, ACTIVE_NOTE_PERSIST_DEBOUNCE_MS)
}

function replaceInList(
  list: readonly NoteMetadata[],
  updated: NoteMetadata
): readonly NoteMetadata[] {
  const idx = list.findIndex((n) => n.id === updated.id)
  if (idx === -1) return [updated, ...list]
  const next = [...list]
  next[idx] = updated
  return next
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
    schedulePersistActiveNote(id)
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
      const updated = await window.api.notes.update(input)
      const { notes, activeNoteId } = get()
      set({ notes: replaceInList(notes, updated) })
      if (activeNoteId === input.id) {
        const note = await window.api.notes.get(input.id)
        set({ activeNote: note })
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      showError(`Failed to update note: ${msg}`)
    }
  },

  moveNoteToFolder: async (noteId: string, folder: string) => {
    try {
      const updated = await window.api.notes.update({ id: noteId, folder })
      const { notes, activeNoteId } = get()
      set({ notes: replaceInList(notes, updated) })
      if (activeNoteId === noteId) {
        const note = await window.api.notes.get(noteId)
        set({ activeNote: note })
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      showError(`Failed to move note: ${msg}`)
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
      } catch (error) {
        // Note may have been deleted externally — silently drop active note
        set({ activeNote: null, activeNoteId: null })
        // eslint-disable-next-line no-console
        console.debug('[note.store] Active note no longer available', error)
      }
    }
  }
}))
