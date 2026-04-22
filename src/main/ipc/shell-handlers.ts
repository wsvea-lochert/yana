import { ipcMain, shell } from 'electron'
import { CHANNELS } from '@shared/constants/channels'
import { NoteIdSchema } from '@shared/schemas/note.schema'
import { ensureInsideVault } from '../services/path-guard'
import { validateIpcInput } from './validate'

export function registerShellHandlers(vaultPath: string): void {
  ipcMain.handle(CHANNELS.SHELL_SHOW_IN_FOLDER, (_event, noteId: unknown) => {
    const safeId = validateIpcInput(NoteIdSchema, noteId, CHANNELS.SHELL_SHOW_IN_FOLDER)
    const filePath = ensureInsideVault(vaultPath, `${safeId}.md`)
    shell.showItemInFolder(filePath)
  })
}
