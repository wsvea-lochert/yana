import { ipcMain } from 'electron'
import { CHANNELS } from '@shared/constants/channels'
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

  ipcMain.handle(CHANNELS.FOLDER_CREATE, (_event, input: { name: string }) => {
    try {
      return folderService.createFolder(input.name)
    } catch (error) {
      throw new Error(
        `Failed to create folder: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  })

  ipcMain.handle(CHANNELS.FOLDER_RENAME, (_event, input: { id: string; name: string }) => {
    try {
      return folderService.renameFolder(input.id, input.name)
    } catch (error) {
      throw new Error(
        `Failed to rename folder: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  })

  ipcMain.handle(CHANNELS.FOLDER_DELETE, (_event, id: string) => {
    try {
      folderService.deleteFolder(id)
    } catch (error) {
      throw new Error(
        `Failed to delete folder: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  })
}
