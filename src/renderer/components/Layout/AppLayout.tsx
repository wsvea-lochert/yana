import { Rocket } from 'lucide-react'
import { Sidebar } from '../Sidebar/Sidebar'
import { Editor } from '../Editor/Editor'
import { ShortcutHint } from '../shared/ShortcutHint'
import { useUiStore } from '../../stores/ui.store'

export function AppLayout() {
  const sidebarVisible = useUiStore((s) => s.sidebarVisible)
  const focusMode = useUiStore((s) => s.focusMode)
  const updateAvailable = useUiStore((s) => s.updateAvailable)

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Drag region for custom title bar */}
      <div className="drag-region fixed top-0 left-0 right-0 h-8 z-50" />

      {/* Sidebar */}
      {!focusMode && sidebarVisible && (
        <aside className="w-72 flex-shrink-0 bg-sidebar text-sidebar-foreground border-r border-border flex flex-col overflow-hidden">
          {/* App title — aligned with traffic lights (y:16, x:16, ~52px wide) */}
          <div className="drag-region relative flex items-center h-[52px] pl-[76px]">
            <span className="text-sm font-bold tracking-wide text-foreground">Yana</span>
            {updateAvailable && (
              <button
                type="button"
                title="Update available — click to restart"
                onClick={() => {
                  const confirmed = window.confirm(
                    'A new version is ready. Restart now to update?'
                  )
                  if (confirmed) {
                    window.api.update.restart()
                  }
                }}
                className="ml-1.5 no-drag cursor-pointer hover:opacity-70 transition-opacity"
              >
                <Rocket className="h-3.5 w-3.5 text-primary" />
              </button>
            )}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <ShortcutHint shortcut="Mod+B" className="ml-0" />
            </div>
          </div>
          <Sidebar />
        </aside>
      )}

      {/* Editor */}
      <main className="flex-1 pt-8 overflow-y-auto">
        <Editor />
      </main>
    </div>
  )
}
