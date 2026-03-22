import type { NoteMetadata, Note, CreateNoteInput, UpdateNoteInput } from './note'
import type { SearchQuery, SearchResult } from './search'

export interface YanaApi {
  notes: {
    list: () => Promise<readonly NoteMetadata[]>
    get: (id: string) => Promise<Note | null>
    create: (input: CreateNoteInput) => Promise<NoteMetadata>
    update: (input: UpdateNoteInput) => Promise<NoteMetadata>
    delete: (id: string) => Promise<void>
  }
  search: {
    query: (query: SearchQuery) => Promise<readonly SearchResult[]>
    quick: (term: string) => Promise<readonly SearchResult[]>
  }
  config: {
    get: (key: string) => Promise<unknown>
    set: (key: string, value: unknown) => Promise<void>
    getVaultPath: () => Promise<string>
  }
  hotkey: {
    updateOverlay: (hotkey: string) => Promise<{ success: boolean; current: string; error?: string }>
    startRecording: () => Promise<void>
  }
  shell: {
    showInFolder: (noteId: string) => Promise<void>
  }
  on: {
    vaultChanged: (callback: (metadata: NoteMetadata) => void) => () => void
    overlayShown: (callback: () => void) => () => void
    navigateToNote: (callback: (noteId: string) => void) => () => void
    themeChanged: (callback: (theme: string) => void) => () => void
    openSettings: (callback: () => void) => () => void
    toggleSidebar: (callback: () => void) => () => void
    toggleFocusMode: (callback: () => void) => () => void
    toggleTheme: (callback: () => void) => () => void
    hotkeyRecorded: (callback: (accelerator: string) => void) => () => void
    noteSaved: (callback: (metadata: NoteMetadata) => void) => () => void
  }
}

export interface OverlayApi {
  search: {
    quick: (term: string) => Promise<readonly SearchResult[]>
  }
  notes: {
    list: () => Promise<readonly NoteMetadata[]>
    get: (id: string) => Promise<Note | null>
    create: (input: CreateNoteInput) => Promise<NoteMetadata>
    update: (input: UpdateNoteInput) => Promise<NoteMetadata>
  }
  overlay: {
    hide: () => Promise<void>
    navigate: (noteId: string) => Promise<void>
  }
  config: {
    get: (key: string) => Promise<unknown>
  }
  on: {
    overlayShown: (callback: () => void) => () => void
    themeChanged: (callback: (theme: string) => void) => () => void
  }
}

declare global {
  interface Window {
    api: YanaApi
  }
}
