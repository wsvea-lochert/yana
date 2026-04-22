import { contextBridge, ipcRenderer } from 'electron'
import type { YanaApi } from '@shared/types/electron-env'
import type { CreateNoteInput, UpdateNoteInput } from '@shared/types/note'
import type { SearchQuery } from '@shared/types/search'

// Inline CHANNELS locally — sandboxed preloads need to be self-contained CJS
// files. If both preload entries imported from @shared/constants/channels,
// Rollup would extract it to out/preload/chunks/ which sandboxed preloads
// cannot always require. Keep in sync with src/shared/constants/channels.ts.
const CHANNELS = Object.freeze({
  NOTE_LIST: 'note:list',
  NOTE_GET: 'note:get',
  NOTE_CREATE: 'note:create',
  NOTE_UPDATE: 'note:update',
  NOTE_DELETE: 'note:delete',
  SEARCH_QUERY: 'search:query',
  SEARCH_QUICK: 'search:quick',
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
  CONFIG_GET_VAULT_PATH: 'config:getVaultPath',
  OVERLAY_HIDE: 'overlay:hide',
  VAULT_CHANGED: 'vault:changed',
  OVERLAY_SHOWN: 'overlay:shown',
  OVERLAY_NAVIGATE: 'overlay:navigate',
  OVERLAY_SHOW_MAIN: 'overlay:showMain',
  THEME_CHANGED: 'theme:changed',
  UPDATE_OVERLAY_HOTKEY: 'hotkey:updateOverlay',
  HOTKEY_START_RECORDING: 'hotkey:startRecording',
  HOTKEY_RECORDED: 'hotkey:recorded',
  NOTE_SAVED: 'note:saved',
  SHELL_SHOW_IN_FOLDER: 'shell:showInFolder',
  FOLDER_LIST: 'folder:list',
  FOLDER_CREATE: 'folder:create',
  FOLDER_RENAME: 'folder:rename',
  FOLDER_DELETE: 'folder:delete',
  UPDATE_AVAILABLE: 'update:available',
  RESTART_FOR_UPDATE: 'update:restart',
  APP_GET_VERSION: 'app:getVersion',
  ATTACHMENT_SAVE: 'attachment:save'
} as const)

function onChannel(channel: string, callback: (...args: unknown[]) => void): () => void {
  const handler = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => callback(...args)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

const api: YanaApi = {
  app: {
    getVersion: () => ipcRenderer.invoke(CHANNELS.APP_GET_VERSION)
  },
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
    updateOverlay: (hotkey: string) => ipcRenderer.invoke(CHANNELS.UPDATE_OVERLAY_HOTKEY, hotkey),
    startRecording: () => ipcRenderer.invoke(CHANNELS.HOTKEY_START_RECORDING)
  },
  folders: {
    list: () => ipcRenderer.invoke(CHANNELS.FOLDER_LIST),
    create: (input: { name: string }) => ipcRenderer.invoke(CHANNELS.FOLDER_CREATE, input),
    rename: (input: { id: string; name: string }) =>
      ipcRenderer.invoke(CHANNELS.FOLDER_RENAME, input),
    delete: (id: string) => ipcRenderer.invoke(CHANNELS.FOLDER_DELETE, id)
  },
  shell: {
    showInFolder: (noteId: string) => ipcRenderer.invoke(CHANNELS.SHELL_SHOW_IN_FOLDER, noteId)
  },
  attachments: {
    save: (input: { filename: string; mime: string; bytes: Uint8Array }) =>
      ipcRenderer.invoke(CHANNELS.ATTACHMENT_SAVE, input)
  },
  update: {
    restart: () => ipcRenderer.invoke(CHANNELS.RESTART_FOR_UPDATE)
  },
  on: {
    vaultChanged: (callback) =>
      onChannel(CHANNELS.VAULT_CHANGED, (data) => callback(data as Parameters<typeof callback>[0])),
    overlayShown: (callback) => onChannel(CHANNELS.OVERLAY_SHOWN, () => callback()),
    navigateToNote: (callback) =>
      onChannel(CHANNELS.OVERLAY_NAVIGATE, (noteId) => callback(noteId as string)),
    themeChanged: (callback) =>
      onChannel(CHANNELS.THEME_CHANGED, (theme) => callback(theme as string)),
    openSettings: (callback) => onChannel('open-settings', () => callback()),
    toggleSidebar: (callback) => onChannel('toggle-sidebar', () => callback()),
    toggleFocusMode: (callback) => onChannel('toggle-focus-mode', () => callback()),
    toggleTheme: (callback) => onChannel('toggle-theme', () => callback()),
    hotkeyRecorded: (callback) =>
      onChannel(CHANNELS.HOTKEY_RECORDED, (accel) => callback(accel as string)),
    noteSaved: (callback) =>
      onChannel(CHANNELS.NOTE_SAVED, (data) => callback(data as Parameters<typeof callback>[0])),
    updateAvailable: (callback) => onChannel(CHANNELS.UPDATE_AVAILABLE, () => callback())
  }
}

contextBridge.exposeInMainWorld('api', api)
