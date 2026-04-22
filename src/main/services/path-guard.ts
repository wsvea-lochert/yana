import { relative, resolve, isAbsolute } from 'path'

export class VaultPathEscapeError extends Error {
  constructor(message = 'Resolved path escapes vault boundary') {
    super(message)
    this.name = 'VaultPathEscapeError'
  }
}

/**
 * Resolve `requestedPath` relative to `vaultPath` and assert the final path
 * remains inside the vault directory. Throws VaultPathEscapeError otherwise.
 *
 * Uses `path.relative` rather than string-prefix matching so the check is
 * correct on Windows (backslash separators, drive letters, UNC prefixes).
 */
export function ensureInsideVault(vaultPath: string, requestedPath: string): string {
  // Reject null bytes up front — Node will throw on them anyway, but catching
  // here gives a consistent error name.
  if (requestedPath.indexOf('\0') !== -1) {
    throw new VaultPathEscapeError('null byte in path')
  }
  const vaultAbs = resolve(vaultPath)
  const resolved = resolve(vaultAbs, requestedPath)
  if (resolved === vaultAbs) return resolved
  const rel = relative(vaultAbs, resolved)
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) {
    throw new VaultPathEscapeError()
  }
  return resolved
}
