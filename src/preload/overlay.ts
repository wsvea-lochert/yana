import { contextBridge, ipcRenderer } from 'electron'
import type { OverlayApi } from '@shared/types/electron-env'
import type { CreateNoteInput, UpdateNoteInput } from '@shared/types/note'

// Inline CHANNELS — see src/preload/index.ts for rationale. Only the subset
// used by the overlay preload is listed. Keep in sync with @shared.
const CHANNELS = Object.freeze({
  NOTE_LIST: 'note:list',
  NOTE_GET: 'note:get',
  NOTE_CREATE: 'note:create',
  NOTE_UPDATE: 'note:update',
  SEARCH_QUICK: 'search:quick',
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
  OVERLAY_HIDE: 'overlay:hide',
  OVERLAY_SHOWN: 'overlay:shown',
  OVERLAY_NAVIGATE: 'overlay:navigate',
  OVERLAY_SHOW_MAIN: 'overlay:showMain',
  THEME_CHANGED: 'theme:changed'
} as const)

const api: OverlayApi = {
  search: {
    quick: (term: string) => ipcRenderer.invoke(CHANNELS.SEARCH_QUICK, term)
  },
  notes: {
    list: () => ipcRenderer.invoke(CHANNELS.NOTE_LIST),
    get: (id: string) => ipcRenderer.invoke(CHANNELS.NOTE_GET, id),
    create: (input: CreateNoteInput) => ipcRenderer.invoke(CHANNELS.NOTE_CREATE, input),
    update: (input: UpdateNoteInput) => ipcRenderer.invoke(CHANNELS.NOTE_UPDATE, input)
  },
  overlay: {
    hide: () => ipcRenderer.invoke(CHANNELS.OVERLAY_HIDE),
    navigate: (noteId: string) => ipcRenderer.invoke(CHANNELS.OVERLAY_NAVIGATE, noteId),
    showMain: () => ipcRenderer.invoke(CHANNELS.OVERLAY_SHOW_MAIN)
  },
  config: {
    get: (key: string) => ipcRenderer.invoke(CHANNELS.CONFIG_GET, key),
    set: (key: string, value: unknown) => ipcRenderer.invoke(CHANNELS.CONFIG_SET, { key, value })
  },
  on: {
    overlayShown: (callback) => {
      const handler = () => callback()
      ipcRenderer.on(CHANNELS.OVERLAY_SHOWN, handler)
      return () => ipcRenderer.removeListener(CHANNELS.OVERLAY_SHOWN, handler)
    },
    themeChanged: (callback) => {
      const handler = (_event: Electron.IpcRendererEvent, theme: string) => callback(theme)
      ipcRenderer.on(CHANNELS.THEME_CHANGED, handler)
      return () => ipcRenderer.removeListener(CHANNELS.THEME_CHANGED, handler)
    }
  }
}

contextBridge.exposeInMainWorld('api', api)
