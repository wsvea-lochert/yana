import { ipcMain, shell, type BrowserWindow, type Input } from 'electron'
import { join } from 'path'
import type { VaultService } from '../services/vault.service'
import type { IndexService } from '../services/index.service'
import type { SearchService } from '../services/search.service'
import type { LinksService } from '../services/links.service'
import type { TagsService } from '../services/tags.service'
import { registerNoteHandlers } from './note-handlers'
import { registerSearchHandlers } from './search-handlers'
import { registerConfigHandlers } from './config-handlers'
import { updateOverlayHotkey, getCurrentOverlayHotkey } from '../hotkeys'
import { CHANNELS } from '@shared/constants/channels'

export interface Services {
  vaultService: VaultService
  indexService: IndexService
  searchService: SearchService
  linksService: LinksService
  tagsService: TagsService
  overlayWindow: BrowserWindow
  mainWindow: BrowserWindow
}

export function registerIpcHandlers(services: Services): void {
  registerNoteHandlers(services.vaultService, services.indexService, services.searchService, services.mainWindow)
  registerSearchHandlers(services.searchService)
  registerConfigHandlers()
  registerOverlayHandler(services.overlayWindow, services.mainWindow)
  registerHotkeyHandler(services.mainWindow)
  registerShellHandlers()
}

function registerOverlayHandler(overlayWindow: BrowserWindow, mainWindow: BrowserWindow): void {
  ipcMain.handle(CHANNELS.OVERLAY_HIDE, () => {
    overlayWindow.hide()
  })

  ipcMain.handle(CHANNELS.OVERLAY_NAVIGATE, (_event, noteId: string) => {
    overlayWindow.hide()
    mainWindow.show()
    mainWindow.focus()
    mainWindow.webContents.send(CHANNELS.OVERLAY_NAVIGATE, noteId)
  })
}

const MODIFIER_KEYS = new Set([
  'Meta', 'Control', 'Alt', 'Shift', 'CapsLock', 'NumLock', 'ScrollLock',
  'meta', 'control', 'alt', 'shift'
])

function inputToAccelerator(input: Input): string | null {
  const parts: string[] = []

  // Electron Input.modifiers is a string[] with values like 'shift', 'control', 'alt', 'meta'/'cmd'
  for (const mod of input.modifiers) {
    switch (mod) {
      case 'meta':
      case 'cmd':
        if (!parts.includes('Command')) parts.push('Command')
        break
      case 'control':
      case 'ctrl':
        if (!parts.includes('Control')) parts.push('Control')
        break
      case 'alt':
        if (!parts.includes('Alt')) parts.push('Alt')
        break
      case 'shift':
        if (!parts.includes('Shift')) parts.push('Shift')
        break
    }
  }

  // Need at least one modifier
  if (parts.length === 0) return null

  const key = input.key
  // Skip if it's a modifier-only press
  if (!key || MODIFIER_KEYS.has(key)) return null

  // Map common key names to Electron accelerator names
  if (key === ' ') {
    parts.push('Space')
  } else if (key === 'Escape') {
    return null // Don't allow Escape as a hotkey
  } else if (key.length === 1) {
    if (key.charCodeAt(0) > 127) return null // ASCII only
    parts.push(key.toUpperCase())
  } else if (key.startsWith('F') && /^F\d+$/.test(key)) {
    parts.push(key) // F1-F24
  } else if (['Tab', 'Backspace', 'Delete', 'Insert', 'Home', 'End', 'PageUp', 'PageDown',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Return'].includes(key)) {
    const mapped = key === 'ArrowUp' ? 'Up' : key === 'ArrowDown' ? 'Down'
      : key === 'ArrowLeft' ? 'Left' : key === 'ArrowRight' ? 'Right'
      : key === 'Return' ? 'Enter' : key
    parts.push(mapped)
  } else {
    return null // Unknown key
  }

  return parts.join('+')
}

function isValidAccelerator(accel: string): boolean {
  return /^[\x20-\x7E]+$/.test(accel) && accel.includes('+')
}

function registerHotkeyHandler(mainWindow: BrowserWindow): void {
  ipcMain.handle(CHANNELS.UPDATE_OVERLAY_HOTKEY, (_event, hotkey: string) => {
    if (!isValidAccelerator(hotkey)) {
      return {
        success: false,
        current: getCurrentOverlayHotkey(),
        error: 'Shortcut must use ASCII keys only'
      }
    }
    const success = updateOverlayHotkey(hotkey)
    return { success, current: getCurrentOverlayHotkey() }
  })

  let activeHandler: ((_event: Electron.Event, input: Input) => void) | null = null

  ipcMain.handle(CHANNELS.HOTKEY_START_RECORDING, () => {
    // Remove any previous handler
    if (activeHandler) {
      mainWindow.webContents.removeListener('before-input-event', activeHandler)
    }

    activeHandler = (_event: Electron.Event, input: Input) => {
      if (input.type !== 'keyDown') return

      // Check if any non-modifier key is present
      const hasModifier = input.modifiers.some((m) =>
        ['meta', 'cmd', 'control', 'ctrl', 'alt', 'shift'].includes(m)
      )
      const key = input.key

      // Skip modifier-only presses (key will be the modifier name itself)
      if (!key || MODIFIER_KEYS.has(key)) return
      // Skip if key is empty string
      if (key.trim() === '') return

      _event.preventDefault()

      if (activeHandler) {
        mainWindow.webContents.removeListener('before-input-event', activeHandler)
        activeHandler = null
      }

      // Must have at least one modifier
      if (!hasModifier) {
        mainWindow.webContents.send(CHANNELS.HOTKEY_RECORDED, '__invalid__')
        return
      }

      const accel = inputToAccelerator(input)

      if (accel) {
        mainWindow.webContents.send(CHANNELS.HOTKEY_RECORDED, accel)
      } else {
        mainWindow.webContents.send(CHANNELS.HOTKEY_RECORDED, '__invalid__')
      }
    }

    mainWindow.webContents.on('before-input-event', activeHandler)

    // Auto-cancel after 10 seconds
    const currentHandler = activeHandler
    setTimeout(() => {
      if (activeHandler === currentHandler) {
        mainWindow.webContents.removeListener('before-input-event', currentHandler)
        activeHandler = null
      }
    }, 10000)
  })
}

function registerShellHandlers(): void {
  ipcMain.handle(CHANNELS.SHELL_SHOW_IN_FOLDER, (_event, noteId: string) => {
    const home = process.env.HOME ?? process.env.USERPROFILE ?? '.'
    const filePath = join(home, 'Yana', `${noteId}.md`)
    shell.showItemInFolder(filePath)
  })
}
