# Frontend Codemap

> Freshness: 2026-03-25

## Entry Points

- `src/renderer/index.html` + `src/renderer/main.tsx` -- Main app
- `src/renderer/overlay/overlay.html` + `src/renderer/overlay/main.tsx` -- Overlay app

## Root Component

`src/renderer/App.tsx` -- Initializes theme, loads notes/folders, sets up:
- Global event listeners (vault changes, note saves, theme sync, update available)
- Keyboard shortcuts (Cmd+P, Cmd+N, Cmd+B, Cmd+Alt+Backspace, Cmd+comma, Cmd+1-9)
- Menu bar event forwarding (settings, sidebar, focus mode, theme)
- Modifier key tracking for Cmd+1-9 sidebar hints

## State Management (Zustand)

`src/renderer/stores/`

| Store | File | Key State |
|-------|------|-----------|
| Note | `note.store.ts` | `notes[]`, `activeNoteId`, `activeNote` + CRUD actions, `moveNoteToFolder` |
| UI | `ui.store.ts` | `sidebarVisible`, `theme`, `focusMode`, `commandPaletteOpen`, `settingsOpen`, `sortBy`, `sortDirection`, `modifierHeld`, `pendingDeleteNoteId`, `updateAvailable` |
| Folder | `folder.store.ts` | `folders[]`, `collapsedFolderIds` + CRUD actions, `toggleCollapsed` |
| Search | `search.store.ts` | Search query and results |
| Toast | `toast.store.ts` | Toast notification state |

## Components (40 total)

`src/renderer/components/`

### Layout
- `Layout/AppLayout.tsx` -- Main app structure (drag region, sidebar toggle, editor)

### Sidebar (11 files)
```
Sidebar/
+-- Sidebar.tsx              # Main sidebar container
+-- SidebarHeader.tsx         # App title + shortcuts
+-- SidebarFooter.tsx         # Footer controls
+-- FolderTree.tsx            # Folder hierarchy + root drop zone
+-- FolderGroup.tsx           # Individual folder (collapsible, drop target)
+-- SidebarNoteItem.tsx       # Note list item (draggable, Cmd+N hints)
+-- SidebarNoteContextMenu.tsx # Right-click menu for notes
+-- FolderContextMenu.tsx     # Right-click menu for folders
+-- CreateFolderDialog.tsx    # New folder dialog
+-- RenameFolderDialog.tsx    # Rename folder dialog
+-- DeleteFolderDialog.tsx    # Delete confirmation dialog
```

#### Drag-and-Drop Architecture

Notes can be dragged between folders using HTML5 DnD:

```
SidebarNoteItem (draggable)
  +-- dragStart: sets note.id in dataTransfer, effectAllowed="move"
  +-- dragEnd: clears visual state

FolderGroup (drop target)
  +-- dragOver: preventDefault, dropEffect="move", highlight ring
  +-- dragLeave: clear highlight (with contains check for child elements)
  +-- drop: read noteId from dataTransfer, call onDropNote(noteId, folderId)
  +-- skips drop if note already in this folder

FolderTree root zone (drop target)
  +-- same DnD handlers as FolderGroup
  +-- drop: calls onMoveNote(noteId, "") to move note to root
  +-- skips drop if note already in root
```

### Editor (3+ files)
```
Editor/
+-- Editor.tsx               # TipTap rich editor (StarterKit, Link, TaskList, TaskItem, CodeBlockLowlight, Markdown, WikiLink)
+-- extensions/wiki-link.ts  # Custom [[...]] link extension
+-- editor.css               # Editor styles
```

Key behaviors:
- Autosave with 500ms debounce
- Wiki-link navigation (`[[note-name]]` -> resolves via slug and opens target)
- Title extraction from first heading
- Task list support (interactive checkboxes)
- Syntax-highlighted code blocks (lowlight)

### Note List (5 files)
```
NoteList/
+-- NoteList.tsx             # Main list container
+-- NoteListHeader.tsx        # Header with sorting controls
+-- NoteListItem.tsx          # Individual note row
+-- NoteListSearch.tsx        # Search/filter input
+-- NoteListContextMenu.tsx   # Right-click menu
```

### Command Palette
- `CommandPalette/CommandPalette.tsx` -- Cmd+P action menu (cmdk library)

### Settings
- `Settings/SettingsDialog.tsx` -- Modal with theme, hotkey config

### Shared Components
```
shared/
+-- ConfirmDialog.tsx         # Generic confirmation
+-- DeleteNoteDialog.tsx      # Delete note confirmation
+-- LoadingBar.tsx            # Progress indicator
+-- ShortcutHint.tsx          # Keyboard shortcut display
+-- Toast.tsx                 # Toast notifications
```

### UI Primitives (shadcn/radix)
`ui/` -- badge, button, command, collapsible, context-menu, dialog, dropdown-menu, input, kbd, scroll-area, separator, sonner, toggle, toggle-group, tooltip

## Hooks

`src/renderer/hooks/`

| Hook | File | Purpose |
|------|------|---------|
| useDebounce | `use-debounce.ts` | Debounce values |
| useIpc | `use-ipc.ts` | IPC listener subscription |
| useKeyboardNav | `use-keyboard-nav.ts` | Arrow key navigation |
| useNotes | `use-notes.ts` | Note fetching |
| useSearch | `use-search.ts` | Search hook |

## Overlay App

`src/renderer/overlay/`

| File | Purpose |
|------|---------|
| `App.tsx` | Overlay root -- dual-mode (capture + search), autosave, visibility flush |
| `ResultsList.tsx` | Search results display |
| `useOverlayEditor.ts` | TipTap editor hook (StarterKit, TaskList, TaskItem, CodeBlockLowlight, Markdown, OverlayKeymap) |
| `overlay.css` | Overlay-specific styles |

### Overlay UI Layout

```
+-- Top bar (draggable) -----------------------------------------+
| [Capture/Edit] [Search]            [ArrowUpRight Cmd+O] [X]   |
+----------------------------------------------------------------+
| Content area (capture mode):                                   |
|   TipTap editor with placeholder                               |
+----------------------------------------------------------------+
| Bottom bar:                                                    |
|   [+ New Cmd+N]                    [save status] [Done Cmd+CR] |
+----------------------------------------------------------------+

+-- Top bar (draggable) -----------------------------------------+
| [Capture] [Search]                 [ArrowUpRight Cmd+O] [X]   |
+----------------------------------------------------------------+
| Content area (search mode):                                    |
|   Search input                                                 |
|   ResultsList (arrow-key navigable)                            |
+----------------------------------------------------------------+
```

### Overlay Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Escape | Save + hide overlay |
| Tab | Toggle capture/search mode |
| Cmd+Enter | Save + hide (capture mode) |
| Cmd+N | New note (capture mode) |
| Cmd+O | Open in main window (capture mode) |
| Arrow Up/Down | Navigate results (search mode) |
| Enter | Open selected result (search mode) |

### Overlay "Open in Main Window" Flow

The ArrowUpRight button and Cmd+O shortcut:
1. Flushes any pending save timer
2. Saves if dirty
3. Hides overlay
4. If editing a note: calls `overlay.navigate(noteId)` -- shows main + navigates
5. If no note: calls `overlay.showMain()` -- shows main window only (OVERLAY_SHOW_MAIN channel)

## Libraries

`src/renderer/lib/`
- `utils.ts` -- `cn()` for className merging (clsx + twMerge)
- `sidebar-order.ts` -- Sidebar ordering logic (used by Cmd+1-9 shortcuts)
