# Decisions

## 2026-04-22: Single big PR rollout
- **Choice**: All 8 phases land on one branch, merged together.
- **Why**: User chose "Single big PR" during scoping. Simpler reviewer context; phases are ordered so earlier work isn't disrupted by later file moves.
- **Alternatives considered**: Sequential phase-per-PR (rejected: slower); parallel tracks (rejected: merge-conflict risk on shared files).

## 2026-04-22: Feature-folder reorg is Phase 7 (last)
- **Choice**: Defer `src/renderer/features/**` move until after all behavior changes land.
- **Why**: Moving files while other phases are editing the same files would create large merge conflicts. Ordering it last also gives an easy escape hatch: if PR size is too large, Phase 7 can spin out without affecting the behavior fixes.
- **Alternatives considered**: Do it first (rejected: every subsequent edit is against a moving target).

## 2026-04-22: Keep titleToSlug as note-ID generator
- **Choice**: Don't introduce nanoid/ULID; formalize current slug via NoteIdSchema regex.
- **Why**: Slugs are human-readable, match existing `.md` filenames, and the vault-file-as-source-of-truth model depends on filename↔id mapping. Switching to ULID would require renaming every note file.
- **Alternatives considered**: nanoid (rejected: breaks existing vaults); ULID (rejected: same).

## 2026-04-22: Vitest workspaces (two projects) over single-config
- **Choice**: Split into `main` (node) and `renderer` (jsdom) projects in one vitest workspace.
- **Why**: Enables jsdom for React component tests without leaking it into better-sqlite3 / Electron main tests that need real node. `@testing-library/jest-dom` is installed but unused — workspace split is what unlocks it.
- **Alternatives considered**: Single jsdom config (rejected: breaks better-sqlite3 binding assumptions in main tests); happy-dom (rejected: jest-dom matchers are already installed for jsdom).
