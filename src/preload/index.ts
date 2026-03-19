import { contextBridge, ipcRenderer } from 'electron'
import { CHANNELS } from '@shared/constants/channels'
import type { QuickNoteApi } from '@shared/types/electron-env'
import type { CreateNoteInput, UpdateNoteInput } from '@shared/types/note'
import type { SearchQuery } from '@shared/types/search'

function onChannel(channel: string, callback: (...args: unknown[]) => void): () => void {
  const handler = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => callback(...args)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

const api: QuickNoteApi = {
  notes: {
    list: () => ipcRenderer.invoke(CHANNELS.NOTE_LIST),
    get: (id: string) => ipcRenderer.invoke(CHANNELS.NOTE_GET, id),
    create: (input: CreateNoteInput) => ipcRenderer.invoke(CHANNELS.NOTE_CREATE, input),
    update: (input: UpdateNoteInput) => ipcRenderer.invoke(CHANNELS.NOTE_UPDATE, input),
    delete: (id: string) => ipcRenderer.invoke(CHANNELS.NOTE_DELETE, id)
  },
  search: {
    query: (query: SearchQuery) => ipcRenderer.invoke(CHANNELS.SEARCH_QUERY, query),
    quick: (term: string) => ipcRenderer.invoke(CHANNELS.SEARCH_QUICK, term)
  },
  config: {
    get: (key: string) => ipcRenderer.invoke(CHANNELS.CONFIG_GET, key),
    set: (key: string, value: unknown) => ipcRenderer.invoke(CHANNELS.CONFIG_SET, { key, value }),
    getVaultPath: () => ipcRenderer.invoke(CHANNELS.CONFIG_GET_VAULT_PATH)
  },
  hotkey: {
    updateOverlay: (hotkey: string) =>
      ipcRenderer.invoke(CHANNELS.UPDATE_OVERLAY_HOTKEY, hotkey),
    startRecording: () => ipcRenderer.invoke(CHANNELS.HOTKEY_START_RECORDING)
  },
  on: {
    vaultChanged: (callback) => onChannel(CHANNELS.VAULT_CHANGED, (data) =>
      callback(data as Parameters<typeof callback>[0])
    ),
    overlayShown: (callback) => onChannel(CHANNELS.OVERLAY_SHOWN, () => callback()),
    navigateToNote: (callback) => onChannel(CHANNELS.OVERLAY_NAVIGATE, (noteId) =>
      callback(noteId as string)
    ),
    themeChanged: (callback) => onChannel(CHANNELS.THEME_CHANGED, (theme) =>
      callback(theme as string)
    ),
    openSettings: (callback) => onChannel('open-settings', () => callback()),
    toggleSidebar: (callback) => onChannel('toggle-sidebar', () => callback()),
    toggleFocusMode: (callback) => onChannel('toggle-focus-mode', () => callback()),
    toggleTheme: (callback) => onChannel('toggle-theme', () => callback()),
    hotkeyRecorded: (callback) => onChannel(CHANNELS.HOTKEY_RECORDED, (accel) =>
      callback(accel as string)
    )
  }
}

contextBridge.exposeInMainWorld('api', api)
