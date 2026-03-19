import { ipcMain } from 'electron'
import { CHANNELS } from '@shared/constants/channels'
import type { VaultService } from '../services/vault.service'
import type { IndexService } from '../services/index.service'
import type { SearchService } from '../services/search.service'
import type { CreateNoteInput, UpdateNoteInput } from '@shared/types/note'

export function registerNoteHandlers(
  vaultService: VaultService,
  indexService: IndexService,
  searchService: SearchService
): void {
  ipcMain.handle(CHANNELS.NOTE_LIST, async () => {
    try {
      return await vaultService.listNotes()
    } catch (error) {
      throw new Error(`Failed to list notes: ${error instanceof Error ? error.message : String(error)}`)
    }
  })

  ipcMain.handle(CHANNELS.NOTE_GET, async (_event, id: string) => {
    try {
      return await vaultService.getNote(id)
    } catch (error) {
      throw new Error(`Failed to get note: ${error instanceof Error ? error.message : String(error)}`)
    }
  })

  ipcMain.handle(CHANNELS.NOTE_CREATE, async (_event, input: CreateNoteInput) => {
    try {
      const metadata = await vaultService.createNote(input)
      const note = await vaultService.getNote(metadata.id)
      if (note) {
        indexService.indexNote(metadata, note.content)
        const allNotes = await vaultService.listNotes()
        searchService.rebuildFuseIndex(allNotes)
      }
      return metadata
    } catch (error) {
      throw new Error(`Failed to create note: ${error instanceof Error ? error.message : String(error)}`)
    }
  })

  ipcMain.handle(CHANNELS.NOTE_UPDATE, async (_event, input: UpdateNoteInput) => {
    try {
      const metadata = await vaultService.updateNote(input)
      const note = await vaultService.getNote(metadata.id)
      if (note) {
        indexService.indexNote(metadata, note.content)
        const allNotes = await vaultService.listNotes()
        searchService.rebuildFuseIndex(allNotes)
      }
      return metadata
    } catch (error) {
      throw new Error(`Failed to update note: ${error instanceof Error ? error.message : String(error)}`)
    }
  })

  ipcMain.handle(CHANNELS.NOTE_DELETE, async (_event, id: string) => {
    try {
      await vaultService.deleteNote(id)
      indexService.removeNote(id)
      const allNotes = await vaultService.listNotes()
      searchService.rebuildFuseIndex(allNotes)
    } catch (error) {
      throw new Error(`Failed to delete note: ${error instanceof Error ? error.message : String(error)}`)
    }
  })
}
