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
