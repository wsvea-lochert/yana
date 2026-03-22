import { titleToSlug } from '@shared/utils/slug'
import type { Folder } from '@shared/types/folder'
import { CreateFolderInputSchema, RenameFolderInputSchema } from '@shared/schemas/folder.schema'

export interface FolderService {
  listFolders(): Folder[]
  createFolder(name: string): Folder
  renameFolder(id: string, name: string): Folder
  deleteFolder(id: string): void
}

export interface FolderStore {
  get(key: string): unknown
  set(key: string, value: unknown): void
}

export function createFolderService(store: FolderStore): FolderService {
  function getFolders(): Folder[] {
    return (store.get('folders') as Folder[]) ?? []
  }

  function saveFolders(folders: readonly Folder[]): void {
    store.set('folders', [...folders])
  }

  function listFolders(): Folder[] {
    return getFolders()
  }

  function createFolder(name: string): Folder {
    const validated = CreateFolderInputSchema.parse({ name })
    const folders = getFolders()

    let slug = titleToSlug(validated.name)
    let uniqueSlug = slug
    let counter = 1
    while (folders.some((f) => f.id === uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`
      counter++
    }

    const maxOrder = folders.reduce((max, f) => Math.max(max, f.sortOrder), -1)
    const folder: Folder = {
      id: uniqueSlug,
      name: validated.name,
      sortOrder: maxOrder + 1
    }

    saveFolders([...folders, folder])
    return folder
  }

  function renameFolder(id: string, name: string): Folder {
    const validated = RenameFolderInputSchema.parse({ id, name })
    const folders = getFolders()
    const index = folders.findIndex((f) => f.id === validated.id)

    if (index === -1) {
      throw new Error(`Folder not found: ${validated.id}`)
    }

    const updated: Folder = {
      ...folders[index],
      name: validated.name
    }

    const newFolders = folders.map((f, i) => (i === index ? updated : f))
    saveFolders(newFolders)
    return updated
  }

  function deleteFolder(id: string): void {
    const folders = getFolders()
    const filtered = folders.filter((f) => f.id !== id)

    if (filtered.length === folders.length) {
      throw new Error(`Folder not found: ${id}`)
    }

    saveFolders(filtered)
  }

  return { listFolders, createFolder, renameFolder, deleteFolder }
}
