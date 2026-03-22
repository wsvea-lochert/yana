import { create } from 'zustand'
import type { Folder } from '@shared/types/folder'
import { useToastStore } from './toast.store'

interface FolderState {
  readonly folders: readonly Folder[]
  readonly collapsedFolderIds: ReadonlySet<string>
  readonly isLoading: boolean
}

interface FolderActions {
  loadFolders: () => Promise<void>
  createFolder: (name: string) => Promise<Folder>
  renameFolder: (id: string, name: string) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  toggleCollapsed: (id: string) => void
}

export type FolderStore = FolderState & FolderActions

function showError(msg: string): void {
  useToastStore.getState().addToast(msg, 'error')
}

export const useFolderStore = create<FolderStore>((set, get) => ({
  folders: [],
  collapsedFolderIds: new Set(),
  isLoading: false,

  loadFolders: async () => {
    set({ isLoading: true })
    try {
      const folders = await window.api.folders.list()
      set({ folders, isLoading: false })
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      set({ isLoading: false })
      showError(`Failed to load folders: ${msg}`)
    }
  },

  createFolder: async (name: string) => {
    try {
      const folder = await window.api.folders.create({ name })
      const { folders } = get()
      set({ folders: [...folders, folder] })
      return folder
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      showError(`Failed to create folder: ${msg}`)
      throw error
    }
  },

  renameFolder: async (id: string, name: string) => {
    try {
      const updated = await window.api.folders.rename({ id, name })
      const { folders } = get()
      set({ folders: folders.map((f) => (f.id === id ? updated : f)) })
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      showError(`Failed to rename folder: ${msg}`)
    }
  },

  deleteFolder: async (id: string) => {
    try {
      await window.api.folders.delete(id)
      const { folders, collapsedFolderIds } = get()
      const newCollapsed = new Set(collapsedFolderIds)
      newCollapsed.delete(id)
      set({
        folders: folders.filter((f) => f.id !== id),
        collapsedFolderIds: newCollapsed
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      showError(`Failed to delete folder: ${msg}`)
    }
  },

  toggleCollapsed: (id: string) => {
    const { collapsedFolderIds } = get()
    const newCollapsed = new Set(collapsedFolderIds)
    if (newCollapsed.has(id)) {
      newCollapsed.delete(id)
    } else {
      newCollapsed.add(id)
    }
    set({ collapsedFolderIds: newCollapsed })
  }
}))
