import { create } from 'zustand'
import type { SearchResult, SearchQuery } from '@shared/types/search'

interface SearchState {
  readonly query: string
  readonly results: readonly SearchResult[]
  readonly isSearching: boolean
}

interface SearchActions {
  setQuery: (query: string) => void
  search: (query: SearchQuery) => Promise<void>
  clearSearch: () => void
}

export type SearchStore = SearchState & SearchActions

export const useSearchStore = create<SearchStore>((set) => ({
  query: '',
  results: [],
  isSearching: false,

  setQuery: (query: string) => {
    set({ query })
  },

  search: async (query: SearchQuery) => {
    set({ isSearching: true })
    try {
      const results = await window.api.search.query(query)
      set({ results, isSearching: false })
    } catch {
      set({ results: [], isSearching: false })
    }
  },

  clearSearch: () => {
    set({ query: '', results: [], isSearching: false })
  }
}))
