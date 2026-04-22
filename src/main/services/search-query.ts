/**
 * Escape a user-provided search term for safe use inside an FTS5 MATCH expression.
 *
 * - Strips control characters
 * - Splits on whitespace
 * - Wraps each token in double-quotes, doubling any internal quotes
 * - Appends `*` (prefix search) only to the last token
 * - Returns '' for empty / whitespace-only input
 */
export function escapeFtsTerm(term: string): string {
  // eslint-disable-next-line no-control-regex
  const cleaned = term.replace(/[\u0000-\u001F\u007F]/g, '').trim()
  if (!cleaned) return ''

  const tokens = cleaned.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return ''

  const quoted = tokens.map((t) => `"${t.replace(/"/g, '""')}"`)
  const last = quoted.length - 1
  quoted[last] = quoted[last] + '*'
  return quoted.join(' ')
}
