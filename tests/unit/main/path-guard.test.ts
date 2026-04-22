import { describe, it, expect } from 'vitest'
import { resolve } from 'path'
import { ensureInsideVault, VaultPathEscapeError } from '@main/services/path-guard'

describe('ensureInsideVault', () => {
  const vault = resolve('/tmp/yana-vault')

  it('returns resolved path when inside vault', () => {
    const result = ensureInsideVault(vault, 'note-1.md')
    expect(result).toBe(resolve(vault, 'note-1.md'))
  })

  it('accepts nested paths under vault', () => {
    const result = ensureInsideVault(vault, 'sub/note.md')
    expect(result).toBe(resolve(vault, 'sub/note.md'))
  })

  it('rejects ../ traversal', () => {
    expect(() => ensureInsideVault(vault, '../evil.md')).toThrow(VaultPathEscapeError)
  })

  it('rejects deep traversal', () => {
    expect(() => ensureInsideVault(vault, '../../../../etc/passwd')).toThrow(VaultPathEscapeError)
  })

  it('rejects absolute paths outside vault', () => {
    expect(() => ensureInsideVault(vault, '/etc/passwd')).toThrow(VaultPathEscapeError)
  })

  it('rejects paths with embedded traversal', () => {
    expect(() => ensureInsideVault(vault, 'sub/../../etc/passwd')).toThrow(VaultPathEscapeError)
  })
})
