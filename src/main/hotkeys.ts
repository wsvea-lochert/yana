import { globalShortcut } from 'electron'
import { DEFAULT_HOTKEY } from '@shared/constants/defaults'

let currentOverlayHotkey = DEFAULT_HOTKEY
let overlayHandler: (() => void) | null = null
let newNoteHandler: (() => void) | null = null

export function registerHotkeys(onToggleOverlay: () => void, onNewNote: () => void): void {
  overlayHandler = onToggleOverlay
  newNoteHandler = onNewNote

  globalShortcut.register(currentOverlayHotkey, onToggleOverlay)
}

export function updateOverlayHotkey(newHotkey: string): boolean {
  if (!overlayHandler) return false

  try {
    globalShortcut.unregister(currentOverlayHotkey)
  } catch {
    // old hotkey may already be unregistered
  }

  const success = globalShortcut.register(newHotkey, overlayHandler)
  if (success) {
    currentOverlayHotkey = newHotkey
    return true
  }

  // rollback to old hotkey if new one fails
  globalShortcut.register(currentOverlayHotkey, overlayHandler)
  return false
}

export function getCurrentOverlayHotkey(): string {
  return currentOverlayHotkey
}

export function unregisterHotkeys(): void {
  globalShortcut.unregisterAll()
}
