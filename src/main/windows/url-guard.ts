export const SAFE_EXTERNAL_SCHEMES = Object.freeze(['http:', 'https:', 'mailto:'] as const)

export function isSafeExternalUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  try {
    const parsed = new URL(url)
    const scheme = parsed.protocol.toLowerCase()
    return (SAFE_EXTERNAL_SCHEMES as readonly string[]).includes(scheme)
  } catch {
    return false
  }
}
