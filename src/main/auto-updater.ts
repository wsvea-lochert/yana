import { autoUpdater } from 'electron-updater'
import { BrowserWindow, dialog } from 'electron'
import { is } from '@electron-toolkit/utils'
import { CHANNELS } from '@shared/constants/channels'

export function initAutoUpdater(): void {
  if (is.dev) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', () => {
    BrowserWindow.getAllWindows().forEach((w) => w.webContents.send(CHANNELS.UPDATE_AVAILABLE))
  })

  autoUpdater.on('update-downloaded', (info) => {
    const mainWindow = BrowserWindow.getAllWindows().find((w) => !w.isAlwaysOnTop())
    const parent = mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined

    dialog
      .showMessageBox({
        ...(parent ? { window: parent } : {}),
        type: 'info',
        title: 'Update Ready',
        message: `Version ${info.version} has been downloaded.`,
        detail: 'The update will be installed when you restart the app.',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall()
        }
      })
  })

  autoUpdater.checkForUpdatesAndNotify()
}

export function checkForUpdates(): void {
  if (is.dev) {
    const mainWindow = BrowserWindow.getAllWindows().find((w) => !w.isAlwaysOnTop())
    const parent = mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined
    dialog.showMessageBox({
      ...(parent ? { window: parent } : {}),
      type: 'info',
      title: 'Updates',
      message: 'Update checking is disabled in development.'
    })
    return
  }

  autoUpdater.once('update-not-available', () => {
    const mainWindow = BrowserWindow.getAllWindows().find((w) => !w.isAlwaysOnTop())
    const parent = mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined
    dialog.showMessageBox({
      ...(parent ? { window: parent } : {}),
      type: 'info',
      title: 'No Updates',
      message: 'You are running the latest version.'
    })
  })

  autoUpdater.checkForUpdatesAndNotify()
}
