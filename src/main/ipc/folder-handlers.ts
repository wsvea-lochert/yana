import { ipcMain } from 'electron'
import { CHANNELS } from '@shared/constants/channels'
import {
  CreateFolderInputSchema,
  RenameFolderInputSchema,
  FolderIdSchema
} from '@shared/schemas/folder.schema'
import { validateIpcInput } from './validate'
import type { FolderService } from '../services/folder.service'

export function registerFolderHandlers(folderService: FolderService): void {
  ipcMain.handle(CHANNELS.FOLDER_LIST, () => {
    try {
      return folderService.listFolders()
    } catch (error) {
      throw new Error(
        `Failed to list folders: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  })

  ipcMain.handle(CHANNELS.FOLDER_CREATE, (_event, input: unknown) => {
    const validated = validateIpcInput(CreateFolderInputSchema, input, CHANNELS.FOLDER_CREATE)
    try {
      return folderService.createFolder(validated.name)
    } catch (error) {
      throw new Error(
        `Failed to create folder: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  })

  ipcMain.handle(CHANNELS.FOLDER_RENAME, (_event, input: unknown) => {
    const validated = validateIpcInput(RenameFolderInputSchema, input, CHANNELS.FOLDER_RENAME)
    try {
      return folderService.renameFolder(validated.id, validated.name)
    } catch (error) {
      throw new Error(
        `Failed to rename folder: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  })

  ipcMain.handle(CHANNELS.FOLDER_DELETE, (_event, id: unknown) => {
    const safeId = validateIpcInput(FolderIdSchema, id, CHANNELS.FOLDER_DELETE)
    try {
      folderService.deleteFolder(safeId)
    } catch (error) {
      throw new Error(
        `Failed to delete folder: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  })
}
