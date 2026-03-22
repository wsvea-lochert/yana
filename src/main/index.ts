import { app } from 'electron'
import { initializeApp } from './app-lifecycle'

if (process.platform === 'darwin') {
  // Override the menu bar name in dev mode
  app.setName('Yana')
  // This sets the name used by the About panel
  app.setAboutPanelOptions({ applicationName: 'Yana' })
}

initializeApp()
