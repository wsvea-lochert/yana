# Contributing to Yana

Thanks for your interest in contributing! Here's how to get started.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/<your-username>/yana.git
   cd yana
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```

## Development Workflow

1. Create a branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```
2. Make your changes
3. Run checks before committing:
   ```bash
   npm run typecheck
   npm run lint
   npm test
   ```
4. Commit using [conventional commits](https://www.conventionalcommits.org/):
   ```
   feat: add new feature
   fix: resolve issue with overlay
   refactor: simplify search logic
   docs: update README
   test: add tests for vault service
   chore: update dependencies
   ```
5. Push your branch and open a pull request against `main`

## Branch Naming

Use a prefix that matches the type of work:

- `feat/` -- new features
- `fix/` -- bug fixes
- `refactor/` -- code improvements
- `docs/` -- documentation
- `test/` -- tests
- `chore/` -- maintenance

## Pull Requests

- Keep PRs focused on a single change
- Include a clear description of what changed and why
- Make sure all checks pass (types, lint, tests)
- Link related issues if applicable

## Code Style

- **TypeScript** -- strict mode, no `any`
- **Immutability** -- create new objects, never mutate
- **Small files** -- prefer many focused files over large ones
- **No `console.log`** -- remove before committing
- **Formatting** -- Prettier handles it. Run `npm run format` if needed.

## Architecture

```
src/
  main/           # Electron main process
    ipc/          # IPC handlers
    services/     # Vault, search, index services
    windows/      # Window creation and management
    db/           # SQLite database and migrations
  preload/        # Preload scripts (IPC bridge)
  renderer/       # React frontend
    components/   # UI components
    stores/       # Zustand state
    overlay/      # Quick capture overlay
  shared/         # Types and constants shared across processes
```

Notes are stored as markdown files in `~/Yana`. The SQLite database is a search index only -- the markdown files are the source of truth.

## Native Modules

Yana uses `better-sqlite3` which requires compilation against Electron's Node.js headers. The `postinstall` script handles this automatically, but if you hit issues:

```bash
npm run rebuild:electron   # Rebuild for Electron
npm run rebuild:node       # Rebuild for Node (needed before running tests)
```

## Reporting Issues

- Check existing issues first
- Include steps to reproduce
- Include your OS and app version
- Attach screenshots if it's a UI issue

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
