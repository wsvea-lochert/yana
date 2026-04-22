import { describe, it, expect } from 'vitest'
import {
  CreateNoteInputSchema,
  UpdateNoteInputSchema,
  NoteIdSchema
} from '@shared/schemas/note.schema'
import {
  CreateFolderInputSchema,
  RenameFolderInputSchema,
  FolderIdSchema
} from '@shared/schemas/folder.schema'
import { SearchQuerySchema } from '@shared/schemas/search.schema'
import {
  AcceleratorSchema,
  ConfigKeyEnum,
  ConfigValueSchemas
} from '@shared/schemas/config.schema'
import { validateIpcInput, IpcValidationError } from '@main/ipc/validate'

describe('IPC boundary validation', () => {
  describe('NoteIdSchema', () => {
    it('rejects path traversal attempts', () => {
      expect(() => validateIpcInput(NoteIdSchema, '../../etc/passwd', 'note:get')).toThrow(
        IpcValidationError
      )
    })
    it('rejects absolute paths', () => {
      expect(() => validateIpcInput(NoteIdSchema, '/etc/passwd', 'note:get')).toThrow(
        IpcValidationError
      )
    })
    it('rejects uppercase ids', () => {
      expect(() => validateIpcInput(NoteIdSchema, 'MyNote', 'note:get')).toThrow(
        IpcValidationError
      )
    })
    it('rejects empty string', () => {
      expect(() => validateIpcInput(NoteIdSchema, '', 'note:get')).toThrow(IpcValidationError)
    })
    it('rejects non-string payload', () => {
      expect(() => validateIpcInput(NoteIdSchema, 42, 'note:get')).toThrow(IpcValidationError)
      expect(() => validateIpcInput(NoteIdSchema, null, 'note:get')).toThrow(IpcValidationError)
    })
    it('accepts valid ids', () => {
      expect(validateIpcInput(NoteIdSchema, 'my-note-1', 'note:get')).toBe('my-note-1')
    })
  })

  describe('CreateNoteInputSchema', () => {
    it('rejects missing title', () => {
      expect(() =>
        validateIpcInput(CreateNoteInputSchema, { content: 'body' }, 'note:create')
      ).toThrow(IpcValidationError)
    })
    it('rejects title over 255 chars', () => {
      expect(() =>
        validateIpcInput(
          CreateNoteInputSchema,
          { title: 'x'.repeat(256) },
          'note:create'
        )
      ).toThrow(IpcValidationError)
    })
  })

  describe('UpdateNoteInputSchema', () => {
    it('rejects without id', () => {
      expect(() =>
        validateIpcInput(UpdateNoteInputSchema, { title: 'x' }, 'note:update')
      ).toThrow(IpcValidationError)
    })
  })

  describe('FolderIdSchema', () => {
    it('rejects path traversal', () => {
      expect(() => validateIpcInput(FolderIdSchema, '../../x', 'folder:delete')).toThrow(
        IpcValidationError
      )
    })
    it('accepts alphanumeric and - _', () => {
      expect(validateIpcInput(FolderIdSchema, 'Folder_1-a', 'folder:delete')).toBe('Folder_1-a')
    })
  })

  describe('CreateFolderInputSchema', () => {
    it('rejects empty name', () => {
      expect(() =>
        validateIpcInput(CreateFolderInputSchema, { name: '' }, 'folder:create')
      ).toThrow(IpcValidationError)
    })
  })

  describe('RenameFolderInputSchema', () => {
    it('requires valid id and name', () => {
      expect(() =>
        validateIpcInput(
          RenameFolderInputSchema,
          { id: '../x', name: 'ok' },
          'folder:rename'
        )
      ).toThrow(IpcValidationError)
      expect(() =>
        validateIpcInput(
          RenameFolderInputSchema,
          { id: 'valid', name: '' },
          'folder:rename'
        )
      ).toThrow(IpcValidationError)
    })
  })

  describe('SearchQuerySchema', () => {
    it('rejects empty term', () => {
      expect(() =>
        validateIpcInput(SearchQuerySchema, { term: '' }, 'search:query')
      ).toThrow(IpcValidationError)
    })
    it('rejects excessive limit', () => {
      expect(() =>
        validateIpcInput(SearchQuerySchema, { term: 'x', limit: 9999 }, 'search:query')
      ).toThrow(IpcValidationError)
    })
  })

  describe('AcceleratorSchema', () => {
    it('requires a + separator', () => {
      expect(() => validateIpcInput(AcceleratorSchema, 'Space', 'hotkey:update')).toThrow(
        IpcValidationError
      )
    })
    it('rejects non-ASCII', () => {
      expect(() =>
        validateIpcInput(AcceleratorSchema, 'Command+\u00e9', 'hotkey:update')
      ).toThrow(IpcValidationError)
    })
    it('accepts Command+A', () => {
      expect(validateIpcInput(AcceleratorSchema, 'Command+A', 'hotkey:update')).toBe(
        'Command+A'
      )
    })
  })

  describe('ConfigKeyEnum', () => {
    it('rejects unknown keys', () => {
      expect(() =>
        validateIpcInput(ConfigKeyEnum, 'maliciousKey', 'config:set')
      ).toThrow(IpcValidationError)
    })
    it('accepts whitelisted keys', () => {
      expect(validateIpcInput(ConfigKeyEnum, 'theme', 'config:set')).toBe('theme')
    })
  })

  describe('ConfigValueSchemas', () => {
    it('theme accepts only light/dark', () => {
      expect(ConfigValueSchemas.theme.safeParse('neon').success).toBe(false)
      expect(ConfigValueSchemas.theme.safeParse('dark').success).toBe(true)
    })
    it('fontSize must be integer 10-24', () => {
      expect(ConfigValueSchemas.fontSize.safeParse(8).success).toBe(false)
      expect(ConfigValueSchemas.fontSize.safeParse(30).success).toBe(false)
      expect(ConfigValueSchemas.fontSize.safeParse(14).success).toBe(true)
    })
  })
})
