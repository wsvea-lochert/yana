/**
 * Extract a clean plain-text title from the first line of a markdown document.
 *
 * Strips heading markers (`#`…`######`), inline formatting (`**`, `*`, `__`,
 * `_`, `~~`, backticks), and link syntax (`[text](url)` → `text`). Falls back
 * to `Untitled` when the line is empty.
 */
export function stripMarkdownTitle(firstLine: string): string {
  const withoutHeading = firstLine.replace(/^#{1,6}\s+/, '')
  const cleaned = withoutHeading
    // Images first (they contain `[...]` so must run before links): ![alt](url) → alt
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    // Links: [text](url) → text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // Bold / italic wrappers (order matters: strip longer runs first)
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/___(.+?)___/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    // Strikethrough
    .replace(/~~(.+?)~~/g, '$1')
    // Inline code
    .replace(/`([^`]+)`/g, '$1')
    .trim()

  return cleaned || 'Untitled'
}

/**
 * Split a markdown document into `{ title, content }` where `title` is the
 * first line stripped of markdown syntax and `content` is everything after
 * the title (skipping blank lines immediately after the heading).
 */
export function extractTitleAndContent(markdown: string): {
  title: string
  content: string
} {
  const lines = markdown.split('\n')
  const firstLine = lines[0] ?? ''
  const title = stripMarkdownTitle(firstLine)

  let contentStart = 1
  while (contentStart < lines.length && lines[contentStart].trim() === '') {
    contentStart++
  }
  const content = lines.slice(contentStart).join('\n')

  return { title, content }
}
