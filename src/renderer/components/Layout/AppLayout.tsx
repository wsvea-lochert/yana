import { NoteList } from '../NoteList/NoteList'
import { Editor } from '../Editor/Editor'
import { useUiStore } from '../../stores/ui.store'

export function AppLayout() {
  const sidebarVisible = useUiStore((s) => s.sidebarVisible)
  const focusMode = useUiStore((s) => s.focusMode)

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Drag region for custom title bar */}
      <div className="drag-region fixed top-0 left-0 right-0 h-8 z-50" />

      {/* Note list panel */}
      {!focusMode && sidebarVisible && (
        <aside className="w-72 flex-shrink-0 bg-sidebar text-sidebar-foreground border-r border-border flex flex-col overflow-hidden">
          {/* App title — aligned with traffic lights (y:16, x:16, ~52px wide) */}
          <div className="drag-region flex items-center h-[52px] pl-[76px]">
            <span className="text-sm font-bold tracking-wide text-foreground">
              PNOT
            </span>
          </div>
          <NoteList />
        </aside>
      )}

      {/* Editor */}
      <main className="flex-1 pt-8 overflow-y-auto">
        <Editor />
      </main>
    </div>
  )
}
