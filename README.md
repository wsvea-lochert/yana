<p align="center">
  <img src="src/renderer/assets/yana_prod.png" alt="Yana" width="128" height="128" />
</p>

<h1 align="center">Yana</h1>

<p align="center">
  Keyboard-first personal knowledge capture tool
</p>

<p align="center">
  <a href="#features">Features</a> &middot;
  <a href="#install">Install</a> &middot;
  <a href="#development">Development</a> &middot;
  <a href="#keyboard-shortcuts">Keyboard Shortcuts</a> &middot;
  <a href="#license">License</a>
</p>

---

Yana is a lightweight desktop app for capturing and retrieving notes without breaking your flow. Press a global hotkey to open a floating overlay, jot down a thought, and get back to what you were doing. Notes are stored as plain markdown files on disk.

## Features

- **Quick Capture Overlay** -- Global hotkey summons a floating window on top of any app. Write or search, then dismiss.
- **Plain Markdown Vault** -- Notes live as `.md` files in `~/Yana`. Edit them with any tool.
- **Full-Text Search** -- SQLite FTS5 index over all note content, titles, and tags.
- **Wiki-Style Links** -- Link between notes with `[[note-name]]` syntax.
- **Tags** -- Organize with frontmatter tags, browse by tag in the sidebar.
- **Command Palette** -- Quick actions via `Cmd/Ctrl+P`.
- **Dark Mode** -- Light and dark themes.
- **Focus Mode** -- Distraction-free editing.
- **Cross-Platform** -- macOS (Intel + Apple Silicon), Windows, and Linux.

## Install

Download the latest release from the [Releases](https://github.com/wsvea-lochert/yana/releases) page.

| Platform | Format |
|----------|--------|
| macOS | `.dmg` |
| Windows | `.exe` (NSIS installer) |
| Linux | `.AppImage` |

## Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
git clone https://github.com/wsvea-lochert/yana.git
cd yana
npm install
npm run dev
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm run dist` | Build and package distributable |
| `npm test` | Run tests |
| `npm run test:coverage` | Run tests with coverage |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | Lint with ESLint |
| `npm run format` | Format with Prettier |

### Tech Stack

- **Electron** + **React** + **TypeScript**
- **TipTap** -- Rich markdown editor
- **SQLite** (better-sqlite3) -- Full-text search index
- **Zustand** -- State management
- **TailwindCSS** -- Styling
- **Electron Vite** -- Build tooling
- **Vitest** -- Testing

## Keyboard Shortcuts

### Global

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl+=` | Toggle quick capture overlay |

### Main Window

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl+P` | Command palette |
| `Cmd/Ctrl+N` | New note |
| `Cmd/Ctrl+B` | Toggle sidebar |
| `Cmd/Ctrl+Backspace` | Delete active note |

### Overlay

| Shortcut | Action |
|----------|--------|
| `Tab` | Switch between Capture and Search |
| `Cmd/Ctrl+Enter` | Save note |
| `Cmd/Ctrl+N` | New note |
| `Escape` | Dismiss overlay |

## Storage

Notes are stored as markdown files with YAML frontmatter in `~/Yana`:

```markdown
---
title: My Note
created: 2025-03-22T10:00:00.000Z
modified: 2025-03-22T10:00:00.000Z
tags: [idea, project]
aliases: []
---

Note content here...
```

A SQLite database in the app's data directory maintains the search index. The markdown files are the source of truth -- edit them with any tool and Yana will pick up the changes.

## License

[MIT](LICENSE)
