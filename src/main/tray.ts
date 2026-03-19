import { Tray, Menu, app, BrowserWindow, nativeImage } from 'electron'
import { join } from 'path'

let tray: Tray | null = null

export function createTray(mainWindow: BrowserWindow, onQuickCapture: () => void): Tray {
  const iconPath = join(__dirname, '../../resources/trayTemplate.png')
  const icon = nativeImage.createFromPath(iconPath)

  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open QuickNote',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      }
    },
    {
      label: 'Quick Capture',
      accelerator: 'Alt+Shift+Space',
      click: onQuickCapture
    },
    { type: 'separator' },
    {
      label: 'Quit',
      accelerator: 'CmdOrCtrl+Q',
      click: () => app.quit()
    }
  ])

  tray.setToolTip('QuickNote')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  return tray
}
