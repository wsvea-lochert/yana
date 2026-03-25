# Frontend Codemap

> Freshness: 2026-03-25

## Entry Points

- `src/renderer/index.html` + `src/renderer/main.tsx` — Main app
- `src/renderer/overlay/overlay.html` + `src/renderer/overlay/main.tsx` — Overlay app

## Root Component

`src/renderer/App.tsx` — Initializes theme, loads notes/folders, sets up:
- Global event listeners (vault changes, note saves)
- Keyboard shortcuts (Cmd+P, Cmd+N, Cmd+B, Cmd+Alt+Backspace)
- Menu bar event forwarding

## State Management (Zustand)

`src/renderer/stores/`

| Store | File | Key State |
|-------|------|-----------|
| Note | `note.store.ts` | `notes[]`, `activeNoteId`, `activeNote` + CRUD actions |
| UI | `ui.store.ts` | `sidebarVisible`, `theme`, `focusMode`, `commandPaletteOpen`, `settingsOpen`, `sortBy`, `sortDirection` |
| Folder | `folder.store.ts` | `folders[]`, `collapsedFolderIds` + CRUD actions |
| Search | `search.store.ts` | Search query and results |
| Toast | `toast.store.ts` | Toast notification state |

## Components (40 total)

`src/renderer/components/`

### Layout
- `Layout/AppLayout.tsx` — Main app structure (drag region, sidebar toggle, editor)

### Sidebar (11 files)
```
Sidebar/
├── Sidebar.tsx              # Main sidebar container
├── SidebarHeader.tsx         # App title + shortcuts
├── SidebarFooter.tsx         # Footer controls
├── FolderTree.tsx            # Folder hierarchy view
├── FolderGroup.tsx           # Individual folder group
├── SidebarNoteItem.tsx       # Note list item
├── SidebarNoteContextMenu.tsx # Right-click menu for notes
├── FolderContextMenu.tsx     # Right-click menu for folders
├── CreateFolderDialog.tsx    # New folder dialog
├── RenameFolderDialog.tsx    # Rename folder dialog
└── DeleteFolderDialog.tsx    # Delete confirmation dialog
```

### Editor (3+ files)
```
Editor/
├── Editor.tsx               # TipTap rich editor (StarterKit, Link, CodeBlock, Markdown, WikiLink)
├── extensions/wiki-link.ts  # Custom [[...]] link extension
└── editor.css               # Editor styles
```

Key behaviors:
- Autosave with 1000ms debounce
- Wiki-link navigation (`[[note-name]]` → resolves and opens target)
- Title extraction from first heading

### Note List (5 files)
```
NoteList/
├── NoteList.tsx             # Main list container
├── NoteListHeader.tsx        # Header with sorting controls
├── NoteListItem.tsx          # Individual note row
├── NoteListSearch.tsx        # Search/filter input
└── NoteListContextMenu.tsx   # Right-click menu
```

### Command Palette
- `CommandPalette/CommandPalette.tsx` — Cmd+P action menu (cmdk library)

### Settings
- `Settings/SettingsDialog.tsx` — Modal with theme, hotkey config

### Shared Components
```
shared/
├── ConfirmDialog.tsx         # Generic confirmation
├── DeleteNoteDialog.tsx      # Delete note confirmation
├── LoadingBar.tsx            # Progress indicator
├── ShortcutHint.tsx          # Keyboard shortcut display
└── Toast.tsx                 # Toast notifications
```

### UI Primitives (shadcn/radix)
`ui/` — badge, button, command, collapsible, context-menu, dialog, dropdown-menu, input, kbd, scroll-area, separator, sonner, toggle, toggle-group, tooltip

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
| `App.tsx` | Overlay root (quick capture + search) |
| `ResultsList.tsx` | Search results display |
| `useOverlayEditor.ts` | Custom editor hook for overlay |
| `overlay.css` | Overlay-specific styles |

## Libraries

`src/renderer/lib/`
- `utils.ts` — `cn()` for className merging (clsx + twMerge)
- `sidebar-order.ts` — Sidebar ordering logic
