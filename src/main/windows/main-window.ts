import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { appState } from '../app-state'

export function buildMainWindowOptions(): Electron.BrowserWindowConstructorOptions {
  return {
    width: 1200,
    height: 800,
    minWidth: 720,
    minHeight: 480,
    show: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  }
}

export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow(buildMainWindowOptions())

  window.on('ready-to-show', () => {
    window.show()
  })

  window.on('close', (e) => {
    if (process.platform === 'darwin' && !appState.isQuitting) {
      e.preventDefault()
      window.hide()
    }
  })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}
