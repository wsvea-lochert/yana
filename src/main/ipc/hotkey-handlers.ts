import { ipcMain, type BrowserWindow, type Input } from 'electron'
import { CHANNELS } from '@shared/constants/channels'
import { AcceleratorSchema } from '@shared/schemas/config.schema'
import { HOTKEY_RECORD_TIMEOUT_MS } from '@shared/constants/defaults'
import { updateOverlayHotkey, getCurrentOverlayHotkey } from '../hotkeys'

const MODIFIER_KEYS = new Set([
  'Meta',
  'Control',
  'Alt',
  'Shift',
  'CapsLock',
  'NumLock',
  'ScrollLock',
  'meta',
  'control',
  'alt',
  'shift'
])

const SPECIAL_KEY_MAP: Record<string, string> = {
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Return: 'Enter'
}

const ALLOWED_NAMED_KEYS = new Set([
  'Tab',
  'Backspace',
  'Delete',
  'Insert',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Enter',
  'Return'
])

function modifiersToParts(modifiers: readonly string[]): string[] {
  const parts: string[] = []
  for (const mod of modifiers) {
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
  return parts
}

export function inputToAccelerator(input: Input): string | null {
  const parts = modifiersToParts(input.modifiers)
  if (parts.length === 0) return null

  const key = input.key
  if (!key || MODIFIER_KEYS.has(key)) return null
  if (key === 'Escape') return null

  if (key === ' ') {
    parts.push('Space')
    return parts.join('+')
  }

  if (key.length === 1) {
    if (key.charCodeAt(0) > 127) return null
    parts.push(key.toUpperCase())
    return parts.join('+')
  }

  if (/^F\d+$/.test(key)) {
    parts.push(key)
    return parts.join('+')
  }

  if (ALLOWED_NAMED_KEYS.has(key)) {
    parts.push(SPECIAL_KEY_MAP[key] ?? key)
    return parts.join('+')
  }

  return null
}

interface HotkeyRecorder {
  start(): void
  stop(): void
}

function createHotkeyRecorder(mainWindow: BrowserWindow): HotkeyRecorder {
  let activeHandler: ((event: Electron.Event, input: Input) => void) | null = null
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null

  function stop(): void {
    if (activeHandler) {
      mainWindow.webContents.removeListener('before-input-event', activeHandler)
      activeHandler = null
    }
    if (timeoutHandle) {
      clearTimeout(timeoutHandle)
      timeoutHandle = null
    }
  }

  function start(): void {
    stop()

    activeHandler = (event, input) => {
      if (input.type !== 'keyDown') return

      const hasModifier = input.modifiers.some((m) =>
        ['meta', 'cmd', 'control', 'ctrl', 'alt', 'shift'].includes(m)
      )
      const key = input.key
      if (!key || MODIFIER_KEYS.has(key)) return
      if (key.trim() === '') return

      event.preventDefault()
      stop()

      if (!hasModifier) {
        mainWindow.webContents.send(CHANNELS.HOTKEY_RECORDED, '__invalid__')
        return
      }

      const accel = inputToAccelerator(input)
      mainWindow.webContents.send(CHANNELS.HOTKEY_RECORDED, accel ?? '__invalid__')
    }

    mainWindow.webContents.on('before-input-event', activeHandler)
    timeoutHandle = setTimeout(stop, HOTKEY_RECORD_TIMEOUT_MS)
  }

  return { start, stop }
}

export function registerHotkeyHandler(mainWindow: BrowserWindow): void {
  ipcMain.handle(CHANNELS.UPDATE_OVERLAY_HOTKEY, (_event, hotkey: unknown) => {
    const parseResult = AcceleratorSchema.safeParse(hotkey)
    if (!parseResult.success) {
      return {
        success: false,
        current: getCurrentOverlayHotkey(),
        error: parseResult.error.issues[0]?.message ?? 'Invalid accelerator'
      }
    }
    const success = updateOverlayHotkey(parseResult.data)
    return { success, current: getCurrentOverlayHotkey() }
  })

  const recorder = createHotkeyRecorder(mainWindow)
  ipcMain.handle(CHANNELS.HOTKEY_START_RECORDING, () => {
    recorder.start()
  })
}

// Re-export for legacy callers expecting a validator
export function isValidAccelerator(accel: string): boolean {
  return AcceleratorSchema.safeParse(accel).success
}

// Used in tests
export const _internal = { MODIFIER_KEYS, SPECIAL_KEY_MAP, ALLOWED_NAMED_KEYS }
