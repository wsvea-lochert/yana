# Data Models & Schemas Codemap

> Freshness: 2026-03-25

## Types

`src/shared/types/`

### Note (`note.ts`)

```typescript
Frontmatter { title, created, modified, tags, aliases, folder }
NoteMetadata { id, filename, title, created, modified, excerpt, wordCount, tags, folder }
Note extends NoteMetadata-like { id, filename, frontmatter, content, rawContent, links, backlinks }
CreateNoteInput { title, content?, tags?, folder? }
UpdateNoteInput { id, title?, content?, tags?, folder? }
```

All interfaces use `readonly` properties throughout.

### Folder (`folder.ts`)

```typescript
Folder { id, name, sortOrder }
```

### Search (`search.ts`)

```typescript
SearchQuery { term, limit?, tags? }
SearchResult { id, title, excerpt, score, matchType, tags, modified }
FtsResult { id, title, rawContent, tags, rank }
```

### IPC (`ipc.ts`)

Typed channel map -- maps each channel name to `{ request, response }` pairs:

| Channel | Request | Response |
|---------|---------|----------|
| note:list | void | NoteMetadata[] |
| note:get | string | Note or null |
| note:create | CreateNoteInput | NoteMetadata |
| note:update | UpdateNoteInput | NoteMetadata |
| note:delete | string | void |
| search:query | SearchQuery | SearchResult[] |
| search:quick | string | SearchResult[] |
| config:get | string | unknown |
| config:set | { key, value } | void |
| config:getVaultPath | void | string |
| overlay:hide | void | void |
| overlay:navigate | string | void |
| folder:list | void | Folder[] |
| folder:create | { name } | Folder |
| folder:rename | { id, name } | Folder |
| folder:delete | string | void |
| vault:changed | (push-only) | NoteMetadata |

Note: IpcChannelMap covers invoke/handle channels. Push-only channels (OVERLAY_SHOWN, OVERLAY_SHOW_MAIN, THEME_CHANGED, HOTKEY_RECORDED, NOTE_SAVED, UPDATE_AVAILABLE) use `webContents.send` and are not in the typed map.

### Electron Environment (`electron-env.d.ts`)

Declares two API shapes:

**YanaApi** (main window):
- `api.notes.*` -- Note CRUD (list, get, create, update, delete)
- `api.folders.*` -- Folder management (list, create, rename, delete)
- `api.search.*` -- Search functions (query, quick)
- `api.config.*` -- Config get/set/getVaultPath
- `api.hotkey.*` -- Hotkey recording (updateOverlay, startRecording)
- `api.shell.*` -- Shell integration (showInFolder)
- `api.on.*` -- Event listeners (11 events)

**OverlayApi** (overlay window):
- `api.notes.*` -- Note CRUD subset (list, get, create, update)
- `api.search.*` -- Quick search only
- `api.overlay.*` -- Overlay control (hide, navigate, showMain)
- `api.config.*` -- Config get/set
- `api.on.*` -- Event listeners (overlayShown, themeChanged)

## Validation Schemas (Zod)

`src/shared/schemas/`

| Schema | File | Validates |
|--------|------|-----------|
| CreateNoteInputSchema | `note.schema.ts` | Note creation input |
| UpdateNoteInputSchema | `note.schema.ts` | Note update input |
| CreateFolderInputSchema | `folder.schema.ts` | Folder creation input |
| RenameFolderInputSchema | `folder.schema.ts` | Folder rename input |
| ConfigSchema | `config.schema.ts` | App configuration |
| SearchQuerySchema | `search.schema.ts` | Search query validation |

## Database Schema

`src/main/db/schema.ts`

### Tables

**notes**
| Column | Type | Purpose |
|--------|------|---------|
| id | TEXT PK | Note identifier |
| filename | TEXT UNIQUE | Filesystem filename |
| title | TEXT | Note title |
| created | TEXT | ISO timestamp |
| modified | TEXT | ISO timestamp |
| excerpt | TEXT | Content preview |
| word_count | INTEGER | Word count |
| tags | TEXT | JSON-encoded tags array |
| links | TEXT | JSON-encoded links array |
| raw_content | TEXT | Full markdown content |
| checksum | TEXT | Content hash for change detection |

**notes_fts** (FTS5 virtual table)
| Column | Source |
|--------|--------|
| title | notes.title |
| raw_content | notes.raw_content |
| tags | notes.tags |

**links**
| Column | Type | Purpose |
|--------|------|---------|
| source_id | TEXT FK | Source note |
| target_id | TEXT FK | Target note |
| context | TEXT | Surrounding text context |

### Triggers
- `notes_ai` -- After INSERT on notes -> INSERT into notes_fts
- `notes_ad` -- After DELETE on notes -> DELETE from notes_fts
- `notes_au` -- After UPDATE on notes -> DELETE + INSERT into notes_fts

## Constants

`src/shared/constants/`

### Channels (`channels.ts`)
26 IPC channels organized by domain:

| Domain | Channels |
|--------|----------|
| Note | NOTE_LIST, NOTE_GET, NOTE_CREATE, NOTE_UPDATE, NOTE_DELETE, NOTE_SAVED |
| Search | SEARCH_QUERY, SEARCH_QUICK |
| Config | CONFIG_GET, CONFIG_SET, CONFIG_GET_VAULT_PATH |
| Overlay | OVERLAY_HIDE, OVERLAY_SHOWN, OVERLAY_NAVIGATE, OVERLAY_SHOW_MAIN |
| Hotkey | UPDATE_OVERLAY_HOTKEY, HOTKEY_START_RECORDING, HOTKEY_RECORDED |
| Theme | THEME_CHANGED |
| Folder | FOLDER_LIST, FOLDER_CREATE, FOLDER_RENAME, FOLDER_DELETE |
| Vault | VAULT_CHANGED |
| Shell | SHELL_SHOW_IN_FOLDER |
| Update | UPDATE_AVAILABLE |

### Defaults (`defaults.ts`)

| Constant | Value | Purpose |
|----------|-------|---------|
| DEFAULT_HOTKEY | CommandOrControl+= | Overlay toggle |
| NEW_NOTE_HOTKEY | Alt+Shift+N | New note shortcut |
| AUTOSAVE_DEBOUNCE_MS | 500 | Editor autosave delay |
| SEARCH_DEBOUNCE_MS | 50 | Search input debounce |
| CHOKIDAR_STABILITY_THRESHOLD | 200 | File watcher stability |
| OVERLAY_WIDTH | 640 | Overlay window width |
| OVERLAY_HEIGHT | 420 | Overlay window height |
| MAX_SEARCH_RESULTS | 20 | Main window search cap |
| MAX_OVERLAY_RESULTS | 7 | Overlay search cap |
| MAX_EXCERPT_LENGTH | 160 | Note excerpt truncation |

## File Format

Notes stored as `.md` files in `~/Yana/`:

```markdown
---
title: My Note
created: 2025-03-22T10:00:00.000Z
modified: 2025-03-22T10:00:00.000Z
tags: [idea, project]
aliases: []
folder: ""
---

Content in markdown with [[wiki-links]] and task lists...
```

## Utilities

`src/shared/utils/`
- `slug.ts` -- Title -> URL-safe slug conversion (used for filenames)
- `date.ts` -- ISO date formatting helpers, relative date display
- `sort.ts` -- Note sorting by modified/created/title with asc/desc direction
