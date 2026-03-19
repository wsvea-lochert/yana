import { ipcMain } from 'electron'
import { CHANNELS } from '@shared/constants/channels'
import type { SearchService } from '../services/search.service'
import type { SearchQuery } from '@shared/types/search'

export function registerSearchHandlers(searchService: SearchService): void {
  ipcMain.handle(CHANNELS.SEARCH_QUERY, (_event, query: SearchQuery) => {
    try {
      return searchService.search(query)
    } catch (error) {
      throw new Error(`Search failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  })

  ipcMain.handle(CHANNELS.SEARCH_QUICK, (_event, term: string) => {
    try {
      return searchService.quickSearch(term)
    } catch (error) {
      throw new Error(`Quick search failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  })
}
