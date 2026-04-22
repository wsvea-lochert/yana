import { ipcMain, BrowserWindow } from 'electron'
import { CHANNELS } from '@shared/constants/channels'
import {
  CreateNoteInputSchema,
  UpdateNoteInputSchema,
  NoteIdSchema
} from '@shared/schemas/note.schema'
import { validateIpcInput } from './validate'
import type { VaultService } from '../services/vault.service'
import type { IndexService } from '../services/index.service'
import type { SearchService } from '../services/search.service'

function broadcast(channel: string, payload: unknown, senderId?: number): void {
  BrowserWindow.getAllWindows()
    .filter((w) => !w.isDestroyed() && w.webContents.id !== senderId)
    .forEach((w) => w.webContents.send(channel, payload))
}

export function registerNoteHandlers(
  vaultService: VaultService,
  indexService: IndexService,
  searchService: SearchService
): void {
  ipcMain.handle(CHANNELS.NOTE_LIST, async () => {
    try {
      return await vaultService.listNotes()
    } catch (error) {
      throw new Error(
        `Failed to list notes: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  })

  ipcMain.handle(CHANNELS.NOTE_GET, async (_event, id: unknown) => {
    const safeId = validateIpcInput(NoteIdSchema, id, CHANNELS.NOTE_GET)
    try {
      return await vaultService.getNote(safeId)
    } catch (error) {
      throw new Error(
        `Failed to get note: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  })

  ipcMain.handle(CHANNELS.NOTE_CREATE, async (event, input: unknown) => {
    const validated = validateIpcInput(CreateNoteInputSchema, input, CHANNELS.NOTE_CREATE)
    try {
      const metadata = await vaultService.createNote(validated)
      const note = await vaultService.getNote(metadata.id)
      if (note) {
        indexService.indexNote(metadata, note.content)
        searchService.applyDelta({ upserts: [metadata], removals: [] })
      }
      broadcast(CHANNELS.NOTE_SAVED, metadata, event.sender.id)
      return metadata
    } catch (error) {
      throw new Error(
        `Failed to create note: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  })

  ipcMain.handle(CHANNELS.NOTE_UPDATE, async (event, input: unknown) => {
    const validated = validateIpcInput(UpdateNoteInputSchema, input, CHANNELS.NOTE_UPDATE)
    try {
      const metadata = await vaultService.updateNote(validated)
      const note = await vaultService.getNote(metadata.id)
      if (note) {
        indexService.indexNote(metadata, note.content)
        searchService.applyDelta({ upserts: [metadata], removals: [] })
      }
      broadcast(CHANNELS.NOTE_SAVED, metadata, event.sender.id)
      return metadata
    } catch (error) {
      throw new Error(
        `Failed to update note: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  })

  ipcMain.handle(CHANNELS.NOTE_DELETE, async (_event, id: unknown) => {
    const safeId = validateIpcInput(NoteIdSchema, id, CHANNELS.NOTE_DELETE)
    try {
      await vaultService.deleteNote(safeId)
      indexService.removeNote(safeId)
      searchService.applyDelta({ upserts: [], removals: [safeId] })
    } catch (error) {
      throw new Error(
        `Failed to delete note: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  })
}
