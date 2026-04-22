import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useFolderStore } from '@renderer/stores/folder.store'

type FoldersApi = {
  list: ReturnType<typeof vi.fn>
  create: ReturnType<typeof vi.fn>
  rename: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}

function setupWindowApi(folders: FoldersApi): void {
  const w = globalThis.window as unknown as { api: { folders: FoldersApi } }
  w.api = { folders }
}

describe('useFolderStore', () => {
  beforeEach(() => {
    useFolderStore.setState({
      folders: [],
      collapsedFolderIds: new Set(),
      isLoading: false
    })
  })

  it('loadFolders populates folders', async () => {
    setupWindowApi({
      list: vi.fn().mockResolvedValue([{ id: 'f1', name: 'Inbox', sortOrder: 0 }]),
      create: vi.fn(),
      rename: vi.fn(),
      delete: vi.fn()
    })
    await useFolderStore.getState().loadFolders()
    expect(useFolderStore.getState().folders).toHaveLength(1)
    expect(useFolderStore.getState().isLoading).toBe(false)
  })

  it('createFolder appends returned folder', async () => {
    setupWindowApi({
      list: vi.fn(),
      create: vi.fn().mockResolvedValue({ id: 'f2', name: 'Ideas', sortOrder: 0 }),
      rename: vi.fn(),
      delete: vi.fn()
    })
    const folder = await useFolderStore.getState().createFolder('Ideas')
    expect(folder.id).toBe('f2')
    expect(useFolderStore.getState().folders.map((f) => f.id)).toEqual(['f2'])
  })

  it('renameFolder updates target by id', async () => {
    useFolderStore.setState({
      folders: [
        { id: 'a', name: 'Old', sortOrder: 0 },
        { id: 'b', name: 'Keep', sortOrder: 1 }
      ]
    })
    setupWindowApi({
      list: vi.fn(),
      create: vi.fn(),
      rename: vi.fn().mockResolvedValue({ id: 'a', name: 'New', sortOrder: 0 }),
      delete: vi.fn()
    })
    await useFolderStore.getState().renameFolder('a', 'New')
    expect(useFolderStore.getState().folders.find((f) => f.id === 'a')?.name).toBe('New')
    expect(useFolderStore.getState().folders.find((f) => f.id === 'b')?.name).toBe('Keep')
  })

  it('deleteFolder removes target and clears collapse state', async () => {
    useFolderStore.setState({
      folders: [{ id: 'a', name: 'A', sortOrder: 0 }],
      collapsedFolderIds: new Set(['a'])
    })
    setupWindowApi({
      list: vi.fn(),
      create: vi.fn(),
      rename: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined)
    })
    await useFolderStore.getState().deleteFolder('a')
    expect(useFolderStore.getState().folders).toHaveLength(0)
    expect(useFolderStore.getState().collapsedFolderIds.has('a')).toBe(false)
  })

  it('toggleCollapsed is immutable', () => {
    const before = useFolderStore.getState().collapsedFolderIds
    useFolderStore.getState().toggleCollapsed('x')
    const after = useFolderStore.getState().collapsedFolderIds
    expect(after).not.toBe(before)
    expect(after.has('x')).toBe(true)
    useFolderStore.getState().toggleCollapsed('x')
    expect(useFolderStore.getState().collapsedFolderIds.has('x')).toBe(false)
  })
})
