import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockApi } from '../../mocks/api.mock'

const mockApi = createMockApi()

vi.stubGlobal('window', { api: mockApi })

const { useSearchStore } = await import('@renderer/stores/search.store')

describe('SearchStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSearchStore.setState({
      query: '',
      results: [],
      isSearching: false
    })
  })

  describe('setQuery', () => {
    it('updates query', () => {
      useSearchStore.getState().setQuery('hello')
      expect(useSearchStore.getState().query).toBe('hello')
    })
  })

  describe('search', () => {
    it('fetches results and stores them', async () => {
      const mockResults = [
        {
          id: 'note-1',
          title: 'Match',
          excerpt: 'A match',
          score: 1,
          matchType: 'title' as const,
          tags: [],
          modified: '2026-01-01T00:00:00.000Z'
        }
      ]
      vi.mocked(mockApi.search.query).mockResolvedValueOnce(mockResults)

      await useSearchStore.getState().search({ term: 'test' })

      expect(mockApi.search.query).toHaveBeenCalledWith({ term: 'test' })
      expect(useSearchStore.getState().results).toEqual(mockResults)
      expect(useSearchStore.getState().isSearching).toBe(false)
    })

    it('clears results on error', async () => {
      vi.mocked(mockApi.search.query).mockRejectedValueOnce(new Error('fail'))

      await useSearchStore.getState().search({ term: 'test' })

      expect(useSearchStore.getState().results).toEqual([])
      expect(useSearchStore.getState().isSearching).toBe(false)
    })
  })

  describe('clearSearch', () => {
    it('resets all search state', () => {
      useSearchStore.setState({
        query: 'something',
        results: [
          {
            id: 'r1',
            title: 'R',
            excerpt: '',
            score: 1,
            matchType: 'title',
            tags: [],
            modified: ''
          }
        ],
        isSearching: true
      })

      useSearchStore.getState().clearSearch()

      expect(useSearchStore.getState().query).toBe('')
      expect(useSearchStore.getState().results).toEqual([])
      expect(useSearchStore.getState().isSearching).toBe(false)
    })
  })
})
