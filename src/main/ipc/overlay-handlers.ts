import { ipcMain, type BrowserWindow } from 'electron'
import { CHANNELS } from '@shared/constants/channels'
import { NoteIdSchema } from '@shared/schemas/note.schema'
import { validateIpcInput } from './validate'

export function registerOverlayHandlers(
  overlayWindow: BrowserWindow,
  mainWindow: BrowserWindow
): void {
  ipcMain.handle(CHANNELS.OVERLAY_HIDE, () => {
    overlayWindow.hide()
  })

  ipcMain.handle(CHANNELS.OVERLAY_NAVIGATE, (_event, noteId: unknown) => {
    const safeId = validateIpcInput(NoteIdSchema, noteId, CHANNELS.OVERLAY_NAVIGATE)
    overlayWindow.hide()
    mainWindow.show()
    mainWindow.focus()
    mainWindow.webContents.send(CHANNELS.OVERLAY_NAVIGATE, safeId)
  })

  ipcMain.handle(CHANNELS.OVERLAY_SHOW_MAIN, () => {
    overlayWindow.hide()
    mainWindow.show()
    mainWindow.focus()
  })
}
