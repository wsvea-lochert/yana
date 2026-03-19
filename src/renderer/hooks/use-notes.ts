import { useEffect, useCallback } from 'react'
import { useNoteStore } from '../stores/note.store'

export function useNotes() {
  const store = useNoteStore()

  useEffect(() => {
    store.loadNotes()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleVaultChange = useCallback(() => {
    store.refreshFromVault()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const unsubscribe = window.api.on.vaultChanged(handleVaultChange)
    return unsubscribe
  }, [handleVaultChange])

  return store
}
