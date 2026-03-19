import { vi } from 'vitest'
import type { QuickNoteApi } from '@shared/types/electron-env'

export function createMockApi(): QuickNoteApi {
  return {
    notes: {
      list: vi.fn().mockResolvedValue([]),
      get: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: 'test-note',
        filename: 'test-note.md',
        title: 'Test Note',
        created: '2026-01-01T00:00:00.000Z',
        modified: '2026-01-01T00:00:00.000Z',
        tags: [],
        excerpt: '',
        wordCount: 0
      }),
      update: vi.fn().mockResolvedValue({
        id: 'test-note',
        filename: 'test-note.md',
        title: 'Test Note',
        created: '2026-01-01T00:00:00.000Z',
        modified: '2026-01-01T00:00:00.000Z',
        tags: [],
        excerpt: '',
        wordCount: 0
      }),
      delete: vi.fn().mockResolvedValue(undefined)
    },
    search: {
      query: vi.fn().mockResolvedValue([]),
      quick: vi.fn().mockResolvedValue([])
    },
    config: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      getVaultPath: vi.fn().mockResolvedValue('/tmp/test-vault')
    },
    hotkey: {
      updateOverlay: vi.fn().mockResolvedValue({ success: true, current: 'Alt+Shift+Space' }),
      startRecording: vi.fn().mockResolvedValue(undefined)
    },
    shell: {
      showInFolder: vi.fn().mockResolvedValue(undefined)
    },
    on: {
      vaultChanged: vi.fn().mockReturnValue(() => {}),
      overlayShown: vi.fn().mockReturnValue(() => {}),
      navigateToNote: vi.fn().mockReturnValue(() => {}),
      themeChanged: vi.fn().mockReturnValue(() => {}),
      openSettings: vi.fn().mockReturnValue(() => {}),
      toggleSidebar: vi.fn().mockReturnValue(() => {}),
      toggleFocusMode: vi.fn().mockReturnValue(() => {}),
      toggleTheme: vi.fn().mockReturnValue(() => {}),
      hotkeyRecorded: vi.fn().mockReturnValue(() => {}),
      noteSaved: vi.fn().mockReturnValue(() => {})
    }
  }
}
