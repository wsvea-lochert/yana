import { ipcMain } from 'electron'
import { z } from 'zod'
import { CHANNELS } from '@shared/constants/channels'
import { SearchQuerySchema } from '@shared/schemas/search.schema'
import { validateIpcInput } from './validate'
import type { SearchService } from '../services/search.service'

const QuickSearchTermSchema = z.string().min(1).max(512)

export function registerSearchHandlers(searchService: SearchService): void {
  ipcMain.handle(CHANNELS.SEARCH_QUERY, (_event, query: unknown) => {
    const validated = validateIpcInput(SearchQuerySchema, query, CHANNELS.SEARCH_QUERY)
    try {
      return searchService.search(validated)
    } catch (error) {
      throw new Error(
        `Search failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  })

  ipcMain.handle(CHANNELS.SEARCH_QUICK, (_event, term: unknown) => {
    const validated = validateIpcInput(QuickSearchTermSchema, term, CHANNELS.SEARCH_QUICK)
    try {
      return searchService.quickSearch(validated)
    } catch (error) {
      throw new Error(
        `Quick search failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  })
}
