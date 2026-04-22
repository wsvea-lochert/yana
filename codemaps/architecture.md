# Architecture Codemap

> Freshness: 2026-03-25

## Overview

**Yana** — Keyboard-first desktop note-taking app.
**Stack:** Electron + React + TypeScript + SQLite + TailwindCSS
**Status:** Alpha | **License:** MIT

## Process Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Main Process (Electron/Node.js)                         │
│  ├── App Lifecycle (init, hotkeys, tray, menu)          │
│  ├── Services (vault, index, search, folder, links/tags)│
│  ├── Database (better-sqlite3, FTS5)                    │
│  ├── IPC Hub (26 typed channels)                        │
│  └── Windows (Main 1200x800, Overlay always-on-top)     │
├─────────────────────────────────────────────────────────┤
│ Preload Bridge                                          │
│  └── window.api — typed IPC exposure (contextBridge)    │
├─────────────────────────────────────────────────────────┤
│ Renderer Process (React SPA)                            │
│  ├── Stores (Zustand: note, ui, folder, search, toast)  │
│  ├── Components (40 total, shadcn/radix UI primitives)  │
│  ├── Hooks (debounce, ipc, keyboard-nav, search, notes) │
│  └── Overlay (separate entry — quick capture window)    │
├─────────────────────────────────────────────────────────┤
│ Shared Layer                                            │
│  ├── Types (note, folder, search, ipc)                  │
│  ├── Schemas (Zod validation)                           │
│  ├── Constants (channels, defaults)                     │
│  └── Utils (slug, date)                                 │
└─────────────────────────────────────────────────────────┘
```

## Directory Layout

```
src/
├── main/              # Electron main process
│   ├── db/            # SQLite database, migrations, schema
│   ├── ipc/           # IPC handlers (note, search, config, folder)
│   ├── services/      # Business logic (vault, index, search, folder, links, tags)
│   └── windows/       # Window creation (main, overlay)
├── preload/           # Preload scripts (index.ts, overlay.ts)
├── renderer/          # React frontend
│   ├── components/    # 40 components organized by feature
│   ├── hooks/         # Custom React hooks (5)
│   ├── lib/           # Utilities (cn, sidebar-order)
│   ├── overlay/       # Quick capture overlay app
│   ├── stores/        # Zustand state stores (5)
│   └── assets/        # Icons
└── shared/            # Cross-process shared code
    ├── types/         # TypeScript interfaces
    ├── schemas/       # Zod validation schemas
    ├── constants/     # Channel names, defaults
    └── utils/         # slug, date helpers
```

## Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage | Plain markdown files (~/Yana) | Portable, editable with any tool |
| Search | SQLite FTS5 + Fuse.js | Full-text + fuzzy title matching |
| State | Zustand | Lightweight, no boilerplate |
| Editor | TipTap (ProseMirror) | Extensible, markdown support |
| IPC | Typed channels via shared types | Type-safe main↔renderer communication |
| UI | shadcn/radix + Tailwind | Accessible, composable primitives |
| Validation | Zod schemas in shared/ | Single source of truth across processes |
| File watching | chokidar | Real-time sync with external edits |

## Data Flow

```
User Input → React Component → Zustand Store → IPC (preload bridge)
→ Main Process Handler → Service Layer → SQLite/Filesystem
→ Response via IPC → Store Update → React Re-render
```

## Build System

- **electron-vite** — Separate builds for main/preload/renderer
- **Vitest** — Unit testing
- **electron-builder** — Distribution (macOS .dmg, Windows .exe, Linux .AppImage)
- **TailwindCSS** via Vite plugin

## Key Features

1. **Quick Capture Overlay** — Global hotkey → floating always-on-top window
2. **Wiki-Style Links** — Custom TipTap extension for `[[...]]` syntax
3. **Command Palette** — Cmd+P via cmdk library
4. **Autosave** — 1000ms debounced saves
5. **Folder Organization** — Metadata in electron-store (not filesystem)
6. **Theme System** — Light/dark with persistence
7. **Attachments** — Paste/drop images & files; stored under `~/Yana/attachments/YYYY/MM/<slug>-<hash>.<ext>`; served to the renderer via a custom `yana-attachment://` protocol (CSP-scoped, path-guarded).
8. **Code-block Copy** — Hover affordance on fenced code blocks powered by a React NodeView over `CodeBlockLowlight`.
9. **Format Toolbar** — Always-visible floating pill at the bottom-center of the main editor. 4 groups / 15 controls (marks, headings, lists, blocks+link) sharing the TipTap editor instance via a transaction-subscribed hook.

## Format Toolbar Architecture

```
Editor.tsx
  └── <FormatToolbar editor={editor} />                    (sticky bottom-6 pill)
        ├── useEditorSelectionState(editor)                (on 'selectionUpdate'|'transaction' → forceUpdate)
        ├── ToolbarButton (×14)                            (native <button>, aria-pressed, mousedown preventDefault)
        │     └── editor.chain().focus().<cmd>().run()
        └── LinkButton                                     (window.prompt → sanitizeLinkUrl → setLink/unsetLink)
```

Key files:
- `src/renderer/components/Editor/FormatToolbar/FormatToolbar.tsx` — parent, 4 groups / 3 dividers
- `src/renderer/components/Editor/FormatToolbar/ToolbarButton.tsx` — native button primitive with `mousedown` preventDefault
- `src/renderer/components/Editor/FormatToolbar/ToolbarDivider.tsx` — vertical separator
- `src/renderer/components/Editor/FormatToolbar/LinkButton.tsx` + `sanitizeLinkUrl`
- `src/renderer/components/Editor/FormatToolbar/useEditorSelectionState.ts` — re-render tick hook
- `src/renderer/components/Editor/FormatToolbar/format-toolbar.types.ts` — `ToolbarAction` / `ToolbarGroup`
- Underline mark via `@tiptap/extension-underline` (registered in `Editor.tsx`)

## Attachment Architecture

```
Paste/Drop → AttachmentUpload plugin → uploadBlob (bytes)
  → window.api.attachments.save (preload)
  → ATTACHMENT_SAVE handler (main)
  → attachment.service (hash + slug + path-guard + write to ~/Yana/attachments/YYYY/MM/)
  → returns { url: 'yana-attachment://local/<rel>', relativePath, size }
  → TipTap inserts image/fileLink node with src/href = protocol URL

On save: markdownProtocolToRelative rewrites src/href back to the portable relative form
         before the note .md hits disk.
On load: markdownRelativeToProtocol rewrites the relative form to the protocol URL
         before TipTap renders.

Runtime serving:
<img src="yana-attachment://local/attachments/2026/04/cat-ab12.png">
  → protocol.handle('yana-attachment', ...)
  → attachmentService.resolveToAbsolutePath (ensureInsideVault)
  → net.fetch(file:///…)
```

Key files:
- `src/main/services/attachment.service.ts` — hashing, slug, dedup, write
- `src/main/security/attachment-protocol.ts` — scheme registration + handler
- `src/main/ipc/attachment-handlers.ts` — `ATTACHMENT_SAVE` channel
- `src/renderer/services/attachment-client.ts` — blob upload + URL translators
- `src/renderer/components/Editor/extensions/attachment-upload.ts` — paste/drop plugin
- `src/renderer/components/Editor/extensions/file-link-node.ts` + `FileLinkNodeView.tsx` — non-image chip node
- `src/renderer/components/Editor/extensions/code-block-copy.ts` + `CodeBlockView.tsx` — copy-button NodeView
