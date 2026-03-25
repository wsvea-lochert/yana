# Data Models & Schemas Codemap

> Freshness: 2026-03-25

## Types

`src/shared/types/`

### Note (`note.ts`)

```typescript
Frontmatter { title, created, modified, tags, aliases, folder }
NoteMetadata { id, filename, title, created, modified, excerpt, wordCount, tags, folder }
Note extends NoteMetadata { content: string }
CreateNoteInput { title?, content?, folder? }
UpdateNoteInput { id, title?, content?, tags?, folder? }
```

### Folder (`folder.ts`)

```typescript
Folder { id, name, parentId? }
```

### Search (`search.ts`)

```typescript
SearchQuery { term, filters? { tags?, folder?, dateRange? } }
SearchResult { noteId, title, excerpt, score, highlights? }
```

### IPC (`ipc.ts`)

Typed channel map — maps each of 26 channel names to `{ request, response }` pairs for type-safe IPC.

### Electron Environment (`electron-env.d.ts`)

Declares `window.api` shape:
- `api.notes.*` — Note CRUD
- `api.search.*` — Search functions
- `api.config.*` — Config get/set
- `api.hotkey.*` — Hotkey recording
- `api.folders.*` — Folder management
- `api.shell.*` — Shell integration
- `api.on.*` — Event listeners

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
- `notes_ai` — After INSERT on notes → INSERT into notes_fts
- `notes_ad` — After DELETE on notes → DELETE from notes_fts
- `notes_au` — After UPDATE on notes → DELETE + INSERT into notes_fts

## Constants

`src/shared/constants/`

### Channels (`channels.ts`)
26 IPC channels: NOTE_LIST, NOTE_GET, NOTE_CREATE, NOTE_UPDATE, NOTE_DELETE, SEARCH_QUERY, SEARCH_QUICK, CONFIG_GET, CONFIG_SET, CONFIG_GET_VAULT_PATH, FOLDER_LIST, FOLDER_CREATE, FOLDER_RENAME, FOLDER_DELETE, OVERLAY_HIDE, OVERLAY_NAVIGATE, HOTKEY_UPDATE, HOTKEY_RECORDING_*, THEME_CHANGED, UPDATE_*, VAULT_CHANGED, NOTE_SAVED_EXTERNAL

### Defaults (`defaults.ts`)
- Excerpt length, autosave delay (1000ms), search result limits

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

Content in markdown with [[wiki-links]]...
```

## Utilities

`src/shared/utils/`
- `slug.ts` — Title → URL-safe slug conversion (used for filenames)
- `date.ts` — ISO date formatting helpers
