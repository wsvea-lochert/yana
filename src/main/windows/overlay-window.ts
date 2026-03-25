import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { OVERLAY_WIDTH, OVERLAY_HEIGHT } from '@shared/constants/defaults'
import { CHANNELS } from '@shared/constants/channels'
import { appState } from '../app-state'

let savedPosition: { x: number; y: number } | null = null
let overlayInstance: BrowserWindow | null = null

export function buildOverlayWindowOptions(): Electron.BrowserWindowConstructorOptions {
  return {
    width: OVERLAY_WIDTH,
    height: OVERLAY_HEIGHT,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    minWidth: 400,
    minHeight: 200,
    maxWidth: 900,
    maxHeight: 600,
    movable: true,
    hasShadow: true,
    roundedCorners: true,
    webPreferences: {
      preload: join(__dirname, '../preload/overlay.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  }
}

function centerOnScreen(window: BrowserWindow): void {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize
  const [winWidth] = window.getSize()
  const x = Math.round((screenWidth - winWidth) / 2)
  const y = Math.round(screenHeight * 0.22)
  window.setPosition(x, y)
}

function loadOverlayContent(window: BrowserWindow): void {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/overlay/overlay.html`)
  } else {
    window.loadFile(join(__dirname, '../renderer/overlay/overlay.html'))
  }
}

export function createOverlayWindow(): BrowserWindow {
  const window = new BrowserWindow(buildOverlayWindowOptions())
  loadOverlayContent(window)

  window.on('moved', () => {
    if (!window.isDestroyed()) {
      const [x, y] = window.getPosition()
      savedPosition = { x, y }
    }
  })

  window.on('close', (e) => {
    if (!appState.isQuitting) {
      e.preventDefault()
      window.hide()
    }
  })

  if (!is.dev) {
    window.on('blur', () => {
      if (!window.isDestroyed()) {
        window.hide()
      }
    })
  }

  overlayInstance = window
  return window
}

function ensureOverlay(window: BrowserWindow): BrowserWindow {
  if (!window.isDestroyed()) return window

  // Recreate if somehow destroyed
  const newWindow = new BrowserWindow(buildOverlayWindowOptions())
  loadOverlayContent(newWindow)
  overlayInstance = newWindow
  return newWindow
}

export function showOverlay(window: BrowserWindow): void {
  const win = ensureOverlay(window)
  if (savedPosition) {
    win.setPosition(savedPosition.x, savedPosition.y)
  } else {
    centerOnScreen(win)
  }
  win.show()
  win.focus()
  win.webContents.send(CHANNELS.OVERLAY_SHOWN)
}

export function hideOverlay(window: BrowserWindow): void {
  if (!window.isDestroyed()) {
    window.hide()
  }
}
