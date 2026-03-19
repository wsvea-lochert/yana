import { useEffect } from 'react'
import { useSearchStore } from '../stores/search.store'
import { useDebounce } from './use-debounce'

export function useSearch(debounceMs: number = 300) {
  const { query, setQuery, search, clearSearch, results, isSearching } = useSearchStore()
  const debouncedQuery = useDebounce(query, debounceMs)

  useEffect(() => {
    if (debouncedQuery.trim()) {
      search({ term: debouncedQuery })
    }
  }, [debouncedQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  return { query, setQuery, results, isSearching, clearSearch }
}
