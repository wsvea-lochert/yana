import { app, ipcMain } from 'electron'
import { is } from '@electron-toolkit/utils'
import { CHANNELS } from '@shared/constants/channels'
import { restartForUpdate } from '../auto-updater'
import { appState } from '../app-state'

export function registerAppHandlers(): void {
  ipcMain.handle(CHANNELS.APP_GET_VERSION, () => (is.dev ? 'dev' : app.getVersion()))

  ipcMain.handle(CHANNELS.RESTART_FOR_UPDATE, () => {
    if (is.dev) return
    try {
      restartForUpdate()
    } catch (error) {
      appState.setQuitting(false)
      throw error
    }
  })
}
