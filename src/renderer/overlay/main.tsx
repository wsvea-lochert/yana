import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/figtree'
import type { OverlayApi } from '@shared/types/electron-env'
import App from './App'
import { ErrorBoundary } from '../components/shared/ErrorBoundary'
import './overlay.css'

const overlayApi = window.api as unknown as OverlayApi

function applyTheme(theme: string): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

overlayApi.config
  .get('theme')
  .then((theme) => {
    applyTheme(typeof theme === 'string' ? theme : 'light')
  })
  .catch(() => {
    // Theme is cosmetic; falling back to default is acceptable.
    applyTheme('light')
  })

overlayApi.on.themeChanged((theme) => {
  applyTheme(theme)
})

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  )
}
