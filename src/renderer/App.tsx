import { useEffect } from 'react'
import { AppLayout } from './components/Layout/AppLayout'
import { CommandPalette } from './components/CommandPalette/CommandPalette'
import { SettingsDialog } from './components/Settings/SettingsDialog'
import { DeleteNoteDialog } from './components/shared/DeleteNoteDialog'
import { Toast } from './components/shared/Toast'
import { useNoteStore } from './stores/note.store'
import { useUiStore } from './stores/ui.store'
import { useFolderStore } from './stores/folder.store'

export default function App() {
  const refreshFromVault = useNoteStore((s) => s.refreshFromVault)
  const loadNotes = useNoteStore((s) => s.loadNotes)
  const selectNote = useNoteStore((s) => s.selectNote)
  const setCommandPaletteOpen = useUiStore((s) => s.setCommandPaletteOpen)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const toggleTheme = useUiStore((s) => s.toggleTheme)
  const toggleFocusMode = useUiStore((s) => s.toggleFocusMode)
  const setModifierHeld = useUiStore((s) => s.setModifierHeld)
  const settingsOpen = useUiStore((s) => s.settingsOpen)
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen)
  const loadFolders = useFolderStore((s) => s.loadFolders)

  useEffect(() => {
    useUiStore.getState().initTheme()
    loadNotes()
    loadFolders()
  }, [loadNotes, loadFolders])

  useEffect(() => {
    const unsubscribe = window.api.on.vaultChanged(() => {
      refreshFromVault()
    })
    return unsubscribe
  }, [refreshFromVault])

  useEffect(() => {
    const unsubscribe = window.api.on.noteSaved(() => {
      refreshFromVault()
    })
    return unsubscribe
  }, [refreshFromVault])

  useEffect(() => {
    const unsubscribe = window.api.on.navigateToNote(async (noteId) => {
      await loadNotes()
      await selectNote(noteId)
    })
    return unsubscribe
  }, [loadNotes, selectNote])

  // Listen for theme changes from other windows
  useEffect(() => {
    const unsubscribe = window.api.on.themeChanged((theme) => {
      document.documentElement.classList.toggle('dark', theme === 'dark')
      useUiStore.setState({ theme: theme === 'dark' ? 'dark' : 'light' })
    })
    return unsubscribe
  }, [])

  // Listen for update available
  useEffect(() => {
    const unsubscribe = window.api.on.updateAvailable(() => {
      useUiStore.getState().setUpdateAvailable(true)
    })
    return unsubscribe
  }, [])

  // Listen for menu bar events
  useEffect(() => {
    const unsubs = [
      window.api.on.openSettings(() => setSettingsOpen(true)),
      window.api.on.toggleSidebar(() => toggleSidebar()),
      window.api.on.toggleFocusMode(() => toggleFocusMode()),
      window.api.on.toggleTheme(() => toggleTheme())
    ]
    return () => unsubs.forEach((u) => u())
  }, [toggleSidebar, toggleFocusMode, toggleTheme, setSettingsOpen])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key === 'p') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }

      if (mod && e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
      }

      if (mod && e.key === 'n') {
        e.preventDefault()
        const { createNote } = useNoteStore.getState()
        createNote({ title: 'Untitled' }).then((metadata) => {
          useNoteStore.getState().selectNote(metadata.id)
        })
      }

      if (mod && e.altKey && e.key === 'Backspace') {
        e.preventDefault()
        const { activeNoteId } = useNoteStore.getState()
        if (activeNoteId) {
          useUiStore.getState().setPendingDeleteNoteId(activeNoteId)
        }
      }

      if (mod && e.key === ',') {
        e.preventDefault()
        setSettingsOpen(true)
      }

      // Cmd+1-9 to select notes by position
      if (mod && e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        const index = parseInt(e.key, 10) - 1
        const { notes } = useNoteStore.getState()
        if (index < notes.length) {
          selectNote(notes[index].id)
        }
      }

      if (e.key === 'Meta' || e.key === 'Control') {
        setModifierHeld(true)
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === 'Meta' || e.key === 'Control') {
        setModifierHeld(false)
      }
    }

    function handleBlur() {
      setModifierHeld(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [setCommandPaletteOpen, toggleSidebar, setModifierHeld, selectNote, setSettingsOpen])

  return (
    <>
      <AppLayout />
      <CommandPalette onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <DeleteNoteDialog />
      <Toast />
    </>
  )
}
