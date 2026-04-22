import { resolve } from 'path'

export class VaultPathEscapeError extends Error {
  constructor(message = 'Resolved path escapes vault boundary') {
    super(message)
    this.name = 'VaultPathEscapeError'
  }
}

/**
 * Resolve `requestedPath` relative to `vaultPath` and assert the final path
 * remains inside the vault directory. Throws VaultPathEscapeError otherwise.
 */
export function ensureInsideVault(vaultPath: string, requestedPath: string): string {
  const vaultAbs = resolve(vaultPath)
  const resolved = resolve(vaultAbs, requestedPath)
  const prefix = vaultAbs.endsWith('/') ? vaultAbs : vaultAbs + '/'
  if (resolved !== vaultAbs && !resolved.startsWith(prefix)) {
    throw new VaultPathEscapeError()
  }
  return resolved
}
