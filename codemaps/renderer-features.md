# Renderer Feature-Folder Reorganization (Draft)

**Status:** Planned / Not yet executed
**Parent plan:** `/Users/william/.claude/plans/mossy-stirring-orbit.md`, Phase 7
**Why deferred:** File moves at this scale create large, noisy diffs that are best reviewed in isolation. The behavior changes from the current PR (security, IPC hardening, repository layer, differential indexing, ErrorBoundary) stand on their own and can ship independently.

## Target Tree

```
src/renderer/
├── App.tsx
├── main.tsx
├── assets/
├── features/
│   ├── notes/
│   │   ├── components/
│   │   │   ├── NoteList.tsx
│   │   │   ├── NoteListContextMenu.tsx
│   │   │   ├── NoteListHeader.tsx
│   │   │   ├── NoteListItem.tsx
│   │   │   └── NoteListSearch.tsx
│   │   ├── hooks/
│   │   │   └── use-notes.ts
│   │   ├── store.ts          # was stores/note.store.ts
│   │   └── types.ts          # re-exports NoteMetadata/Note from @shared
│   ├── folders/
│   │   ├── components/
│   │   │   ├── CreateFolderDialog.tsx
│   │   │   ├── DeleteFolderDialog.tsx
│   │   │   ├── FolderContextMenu.tsx
│   │   │   ├── FolderGroup.tsx
│   │   │   ├── FolderTree.tsx
│   │   │   ├── RenameFolderDialog.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── SidebarFooter.tsx
│   │   │   ├── SidebarHeader.tsx
│   │   │   ├── SidebarNoteContextMenu.tsx
│   │   │   └── SidebarNoteItem.tsx
│   │   └── store.ts          # was stores/folder.store.ts
│   ├── search/
│   │   ├── components/
│   │   │   └── CommandPalette.tsx
│   │   ├── hooks/
│   │   │   └── use-search.ts
│   │   └── store.ts          # was stores/search.store.ts
│   ├── editor/
│   │   ├── components/
│   │   │   └── Editor.tsx
│   │   └── extensions/
│   │       └── wiki-link.ts
│   ├── overlay/              # moved from src/renderer/overlay/*
│   │   ├── App.tsx
│   │   ├── ResultsList.tsx
│   │   ├── main.tsx
│   │   ├── useOverlayEditor.ts
│   │   ├── overlay.html
│   │   └── overlay.css
│   └── settings/
│       └── components/
│           └── SettingsDialog.tsx
├── components/
│   ├── shared/               # kept — cross-cutting presentational
│   │   ├── ConfirmDialog.tsx
│   │   ├── DeleteNoteDialog.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── LoadingBar.tsx
│   │   ├── ShortcutHint.tsx
│   │   └── Toast.tsx
│   ├── Layout/
│   │   └── AppLayout.tsx
│   └── ui/                   # kept — shadcn primitives
└── hooks/                    # only truly generic hooks
    ├── use-debounce.ts
    ├── use-ipc.ts
    └── use-keyboard-nav.ts
└── stores/                   # remaining cross-cutting stores
    ├── toast.store.ts
    └── ui.store.ts
└── lib/
    ├── sidebar-order.ts
    └── utils.ts
```

## Path Alias Additions

```ts
'@features': resolve(__dirname, 'src/renderer/features')
```

## Migration Strategy (when executed)

1. One commit per feature (notes → folders → search → editor → overlay → settings). Each commit compiles and passes tests on its own.
2. Each commit:
   - `git mv` files into `features/<name>/`
   - Update all imports across the repo
   - `npm run typecheck && npm run test` must be green before committing
3. Final commit updates `tsconfig.json`, `electron.vite.config.ts`, `vitest.config.ts` aliases

## Acceptance Criteria

- `npm run typecheck` green
- `npm run test` all 211+ tests pass
- `npm run build` produces an identical electron bundle (diff the `dist/` sizes)
- No `../` import path grows longer after the move
