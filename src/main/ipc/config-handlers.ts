import { ipcMain, BrowserWindow } from 'electron'
import { CHANNELS } from '@shared/constants/channels'
import { join } from 'path'

interface ConfigStore {
  get(key: string): unknown
  set(key: string, value: unknown): void
}

let store: ConfigStore | null = null

async function getStore(): Promise<ConfigStore> {
  if (!store) {
    const ElectronStore = (await import('electron-store')).default
    store = new ElectronStore() as unknown as ConfigStore
  }
  return store
}

export function registerConfigHandlers(): void {
  ipcMain.handle(CHANNELS.CONFIG_GET, async (_event, key: string) => {
    try {
      const s = await getStore()
      return s.get(key)
    } catch (error) {
      throw new Error(`Failed to get config: ${error instanceof Error ? error.message : String(error)}`)
    }
  })

  ipcMain.handle(CHANNELS.CONFIG_SET, async (_event, payload: { key: string; value: unknown }) => {
    try {
      const s = await getStore()
      s.set(payload.key, payload.value)

      if (payload.key === 'theme') {
        BrowserWindow.getAllWindows().forEach((w) =>
          w.webContents.send(CHANNELS.THEME_CHANGED, payload.value)
        )
      }
    } catch (error) {
      throw new Error(`Failed to set config: ${error instanceof Error ? error.message : String(error)}`)
    }
  })

  ipcMain.handle(CHANNELS.CONFIG_GET_VAULT_PATH, () => {
    const home = process.env.HOME ?? process.env.USERPROFILE ?? '.'
    return join(home, 'QuickNote')
  })
}
