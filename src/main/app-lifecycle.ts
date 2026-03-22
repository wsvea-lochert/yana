import { app, BrowserWindow, nativeImage } from 'electron'
import { createMainWindow } from './windows/main-window'
import { createOverlayWindow, showOverlay, hideOverlay } from './windows/overlay-window'
import { createTray } from './tray'
import { createAppMenu } from './menu'
import { registerHotkeys, unregisterHotkeys, updateOverlayHotkey } from './hotkeys'
import { registerIpcHandlers } from './ipc/ipc-hub'
import { createVaultService } from './services/vault.service'
import { createIndexService } from './services/index.service'
import { createSearchService } from './services/search.service'
import { createLinksService } from './services/links.service'
import { createTagsService } from './services/tags.service'
import { createFolderService } from './services/folder.service'
import { createDatabase } from './db/database'
import { runMigrations } from './db/migrations'
import { CHANNELS } from '@shared/constants/channels'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { initAutoUpdater } from './auto-updater'

export function initializeApp(): void {
  app.whenReady().then(async () => {
    if (is.dev) {
      app.setName('Yana (Dev)')

      if (process.platform === 'darwin') {
        const iconPath = join(__dirname, '../../src/renderer/assets/yana_dev_dock.png')
        const icon = nativeImage.createFromPath(iconPath)
        if (!icon.isEmpty()) {
          app.dock?.setIcon(icon)
        }
      }
    }

    const home = process.env.HOME ?? process.env.USERPROFILE ?? '.'
    const vaultPath = join(home, 'Yana')
    const dbPath = join(app.getPath('userData'), 'yana.db')

    const db = createDatabase(dbPath)
    runMigrations(db)

    const ElectronStore = (await import('electron-store')).default
    const folderStore = new ElectronStore({ name: 'folders' }) as {
      get(key: string): unknown
      set(key: string, value: unknown): void
    }

    const vaultService = createVaultService(vaultPath)
    const indexService = createIndexService(db)
    const linksService = createLinksService()
    const tagsService = createTagsService()
    const searchService = createSearchService(db)
    const folderService = createFolderService(folderStore)

    const allNotes = await vaultService.listNotes()
    indexService.fullReindex(allNotes)
    searchService.rebuildFuseIndex(allNotes)
    linksService.buildGraph(allNotes.map((n) => ({ id: n.id, content: '' })))

    const mainWindow = createMainWindow()
    const overlayWindow = createOverlayWindow()

    registerIpcHandlers({
      vaultService,
      indexService,
      searchService,
      linksService,
      tagsService,
      folderService,
      overlayWindow,
      mainWindow
    })

    createAppMenu(mainWindow)
    createTray(mainWindow, () => showOverlay(overlayWindow))

    registerHotkeys(
      () => {
        if (overlayWindow.isVisible()) {
          hideOverlay(overlayWindow)
        } else {
          showOverlay(overlayWindow)
        }
      },
      () => {
        showOverlay(overlayWindow)
      }
    )

    // Load saved overlay hotkey
    try {
      const ElectronStore = (await import('electron-store')).default
      const store = new ElectronStore() as unknown as { get(key: string): unknown }
      const savedHotkey = store.get('overlayHotkey')
      if (typeof savedHotkey === 'string' && savedHotkey) {
        updateOverlayHotkey(savedHotkey)
      }
    } catch {
      // use default hotkey
    }

    vaultService.startWatching(async (event) => {
      if (event.type === 'change' || event.type === 'add') {
        const note = await vaultService.getNote(event.id)
        if (note) {
          const metadata = (await vaultService.listNotes()).find((n) => n.id === event.id)
          if (metadata) {
            indexService.indexNote(metadata, note.content)
            const allNotesUpdated = await vaultService.listNotes()
            searchService.rebuildFuseIndex(allNotesUpdated)
            BrowserWindow.getAllWindows().forEach((w) =>
              w.webContents.send(CHANNELS.VAULT_CHANGED, metadata)
            )
          }
        }
      } else if (event.type === 'unlink') {
        indexService.removeNote(event.id)
        const allNotesUpdated = await vaultService.listNotes()
        searchService.rebuildFuseIndex(allNotesUpdated)
        BrowserWindow.getAllWindows().forEach((w) =>
          w.webContents.send(CHANNELS.VAULT_CHANGED, { id: event.id, deleted: true })
        )
      }
    })

    mainWindow.show()
    initAutoUpdater()
  })

  app.on('will-quit', () => {
    unregisterHotkeys()
  })

  app.on('activate', () => {
    const mainWin = BrowserWindow.getAllWindows().find((w) => !w.isAlwaysOnTop())
    if (mainWin) {
      mainWin.show()
      mainWin.focus()
    }
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}
