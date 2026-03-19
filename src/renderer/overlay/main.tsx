import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/figtree'
import type { OverlayApi } from '@shared/types/electron-env'
import App from './App'
import './overlay.css'

const overlayApi = window.api as unknown as OverlayApi

function applyTheme(theme: string): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

overlayApi.config.get('theme').then((theme) => {
  applyTheme(typeof theme === 'string' ? theme : 'light')
}).catch(() => {})

overlayApi.on.themeChanged((theme) => {
  applyTheme(theme)
})

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}
