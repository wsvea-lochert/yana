import type { BrowserWindow } from 'electron'
import type { VaultService } from '../services/vault.service'
import type { IndexService } from '../services/index.service'
import type { SearchService } from '../services/search.service'
import type { LinksService } from '../services/links.service'
import type { TagsService } from '../services/tags.service'
import type { FolderService } from '../services/folder.service'
import { registerNoteHandlers } from './note-handlers'
import { registerSearchHandlers } from './search-handlers'
import { registerConfigHandlers } from './config-handlers'
import { registerFolderHandlers } from './folder-handlers'
import { registerOverlayHandlers } from './overlay-handlers'
import { registerHotkeyHandler } from './hotkey-handlers'
import { registerShellHandlers } from './shell-handlers'
import { registerAppHandlers } from './app-handlers'

export interface Services {
  vaultService: VaultService
  indexService: IndexService
  searchService: SearchService
  linksService: LinksService
  tagsService: TagsService
  folderService: FolderService
  overlayWindow: BrowserWindow
  mainWindow: BrowserWindow
  vaultPath: string
}

export function registerIpcHandlers(services: Services): void {
  registerNoteHandlers(services.vaultService, services.indexService, services.searchService)
  registerSearchHandlers(services.searchService)
  registerConfigHandlers(services.vaultPath)
  registerFolderHandlers(services.folderService)
  registerOverlayHandlers(services.overlayWindow, services.mainWindow)
  registerHotkeyHandler(services.mainWindow)
  registerShellHandlers(services.vaultPath)
  registerAppHandlers()
}
