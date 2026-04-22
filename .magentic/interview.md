# Interview Results

- Project type: Electron desktop app (keyboard-first knowledge capture tool)
- Stack: Electron 35 + React 19 + TypeScript + better-sqlite3 + Zustand + Vitest + tiptap
- Design: shadcn/ui + Radix + Tailwind (existing)
- Testing: TDD — tests first (Red/Green/Refactor); 80%+ coverage target
- Deploy: electron-builder (desktop distribution)
- Performance: local-first, must remain <50ms save latency at 2k notes
- Accessibility: not scoped
- Constraints:
  - Single big PR
  - Migration-safe (existing vaults must keep working)
  - No breaking IPC/schema changes without accompanying migrations
