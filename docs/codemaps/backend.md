# Backend Codemap

> Freshness: 2026-03-25

## Entry Point

`src/main/index.ts` -- Electron app bootstrap

## App Lifecycle

`src/main/app-lifecycle.ts` -- Initialization orchestrator:
- Creates database, runs migrations
- Initializes all services (vault, index, search, folder, links, tags)
- Creates windows (main, overlay)
- Registers IPC handlers via hub
- Starts file watcher
- Sets up global hotkeys and tray

Supporting modules:
- `src/main/hotkeys.ts` -- Global hotkey registration (overlay toggle)
- `src/main/tray.ts` -- System tray integration
- `src/main/menu.ts` -- Application menu (macOS/Windows/Linux)
- `src/main/auto-updater.ts` -- Update checking and installation

## Database Layer

`src/main/db/`

| File | Purpose |
|------|---------|
| `database.ts` | SQLite instance creation (WAL mode, foreign keys, busy timeout) |
| `schema.ts` | Table definitions: `notes`, `notes_fts` (FTS5), `links` + triggers |
| `migrations.ts` | Schema version management |

### Schema

```sql
notes (id, filename, title, created, modified, excerpt, word_count, tags, links, raw_content, checksum)
notes_fts (title, raw_content, tags)  -- FTS5 virtual table
links (source_id, target_id, context)  -- Note relationships
```

Triggers auto-sync `notes` <-> `notes_fts` on insert/update/delete.

## Services

`src/main/services/`

| Service | File | Responsibilities |
|---------|------|-----------------|
| VaultService | `vault.service.ts` | File I/O for ~/Yana vault -- CRUD notes as .md files, chokidar file watcher |
| IndexService | `index.service.ts` | SQLite indexing -- fullReindex, indexNote, removeNote |
| SearchService | `search.service.ts` | Hybrid search -- FTS5 content search + Fuse.js fuzzy title search |
| FolderService | `folder.service.ts` | Folder CRUD -- metadata stored in electron-store |
| LinksService | `links.service.ts` | Backlink tracking between notes |
| TagsService | `tags.service.ts` | Tag extraction and management |

### Service Dependencies

```
VaultService (filesystem) --+
                             +-- IndexService (SQLite) -- SearchService (FTS5 + Fuse)
LinksService (SQLite) -------+
FolderService (electron-store) -- independent
TagsService -- reads from index
```

## IPC Layer

`src/main/ipc/`

| File | Channels |
|------|----------|
| `ipc-hub.ts` | Central registration -- routes all channels to handlers |
| `note-handlers.ts` | NOTE_LIST, NOTE_GET, NOTE_CREATE, NOTE_UPDATE, NOTE_DELETE |
| `search-handlers.ts` | SEARCH_QUERY, SEARCH_QUICK |
| `config-handlers.ts` | CONFIG_GET, CONFIG_SET, CONFIG_GET_VAULT_PATH |
| `folder-handlers.ts` | FOLDER_LIST, FOLDER_CREATE, FOLDER_RENAME, FOLDER_DELETE |

### IPC Hub Inline Handlers

The `ipc-hub.ts` also registers handlers directly for:

| Channel Group | Channels | Behavior |
|---------------|----------|----------|
| Overlay | OVERLAY_HIDE, OVERLAY_NAVIGATE, OVERLAY_SHOW_MAIN | Hide overlay; NAVIGATE also shows main + sends noteId; SHOW_MAIN shows main without note navigation |
| Hotkey | UPDATE_OVERLAY_HOTKEY, HOTKEY_START_RECORDING | Hotkey recording via before-input-event, 10s auto-cancel |
| Shell | SHELL_SHOW_IN_FOLDER | Opens Finder/Explorer at note file path |

All channels defined in `src/shared/constants/channels.ts` (26 total).

### IPC Hub Services Interface

```typescript
interface Services {
  vaultService, indexService, searchService,
  linksService, tagsService, folderService,
  overlayWindow, mainWindow  // BrowserWindow refs
}
```

## Windows

`src/main/windows/`

| Window | File | Specs |
|--------|------|-------|
| Main | `main-window.ts` | 1200x800, min 720x480, hiddenInset titlebar, sandbox off |
| Overlay | `overlay-window.ts` | 640x420, always-on-top, quick capture |

## Preload Scripts

`src/preload/`

| File | Exposed API | Target Window |
|------|-------------|---------------|
| `index.ts` | `YanaApi` -- full API (notes, folders, search, config, hotkey, shell, events) | Main window |
| `overlay.ts` | `OverlayApi` -- subset (notes CRUD, search.quick, overlay.hide/navigate/showMain, config, events) | Overlay window |

### Overlay API Surface

The overlay preload exposes `overlay.showMain()` which invokes `OVERLAY_SHOW_MAIN` -- hides overlay and shows main window without navigating to a specific note. This complements `overlay.navigate(noteId)` which also navigates to a note.
