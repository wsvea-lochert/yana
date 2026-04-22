import { app } from 'electron'
import { initializeApp } from './app-lifecycle'

// Global safety net so silent startup crashes don't leave the user without a
// window. These fire only on truly unhandled paths — normal errors are caught
// inside the whenReady chain.
process.on('uncaughtException', (error) => {
  // eslint-disable-next-line no-console
  console.error('[main] uncaughtException', error)
})
process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('[main] unhandledRejection', reason)
})

if (process.platform === 'darwin') {
  // Override the menu bar name in dev mode
  app.setName('Yana')
  // This sets the name used by the About panel
  app.setAboutPanelOptions({ applicationName: 'Yana' })
}

initializeApp()
