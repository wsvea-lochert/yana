import { ipcMain, BrowserWindow } from 'electron'
import { z } from 'zod'
import { CHANNELS } from '@shared/constants/channels'
import { ConfigKeyEnum, ConfigValueSchemas } from '@shared/schemas/config.schema'
import { validateIpcInput } from './validate'

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

const ConfigSetPayloadSchema = z.object({
  key: ConfigKeyEnum,
  value: z.unknown()
})

export function registerConfigHandlers(vaultPath: string): void {
  ipcMain.handle(CHANNELS.CONFIG_GET, async (_event, key: unknown) => {
    const safeKey = validateIpcInput(ConfigKeyEnum, key, CHANNELS.CONFIG_GET)
    try {
      const s = await getStore()
      return s.get(safeKey)
    } catch (error) {
      throw new Error(
        `Failed to get config: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  })

  ipcMain.handle(CHANNELS.CONFIG_SET, async (_event, payload: unknown) => {
    const validated = validateIpcInput(ConfigSetPayloadSchema, payload, CHANNELS.CONFIG_SET)
    const valueSchema = ConfigValueSchemas[validated.key]
    const valueResult = valueSchema.safeParse(validated.value)
    if (!valueResult.success) {
      throw new Error(
        `Invalid value for ${validated.key}: ${valueResult.error.issues[0]?.message ?? 'validation failed'}`
      )
    }
    try {
      const s = await getStore()
      s.set(validated.key, valueResult.data)

      if (validated.key === 'theme') {
        BrowserWindow.getAllWindows().forEach((w) =>
          w.webContents.send(CHANNELS.THEME_CHANGED, valueResult.data)
        )
      }
    } catch (error) {
      throw new Error(
        `Failed to set config: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  })

  ipcMain.handle(CHANNELS.CONFIG_GET_VAULT_PATH, () => vaultPath)
}
