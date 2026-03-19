const WIKI_LINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g

export interface LinkEntry {
  readonly source: string
  readonly target: string
}

export interface LinksService {
  buildGraph(notes: ReadonlyArray<{ id: string; content: string }>): void
  getOutgoingLinks(noteId: string): readonly string[]
  getBacklinks(noteId: string): readonly string[]
  extractLinks(content: string): readonly string[]
}

export function createLinksService(): LinksService {
  let outgoing = new Map<string, readonly string[]>()
  let incoming = new Map<string, readonly string[]>()

  function extractLinks(content: string): readonly string[] {
    const links: string[] = []
    let match: RegExpExecArray | null
    const regex = new RegExp(WIKI_LINK_REGEX.source, WIKI_LINK_REGEX.flags)
    while ((match = regex.exec(content)) !== null) {
      links.push(match[1].trim().toLowerCase())
    }
    return links
  }

  function buildGraph(notes: ReadonlyArray<{ id: string; content: string }>): void {
    const newOutgoing = new Map<string, readonly string[]>()
    const newIncoming = new Map<string, string[]>()

    for (const note of notes) {
      const links = extractLinks(note.content)
      newOutgoing.set(note.id, links)

      for (const target of links) {
        const existing = newIncoming.get(target) ?? []
        newIncoming.set(target, [...existing, note.id])
      }
    }

    outgoing = newOutgoing
    incoming = new Map(
      Array.from(newIncoming.entries()).map(([k, v]) => [k, Object.freeze(v)])
    )
  }

  function getOutgoingLinks(noteId: string): readonly string[] {
    return outgoing.get(noteId) ?? []
  }

  function getBacklinks(noteId: string): readonly string[] {
    return incoming.get(noteId) ?? []
  }

  return { buildGraph, getOutgoingLinks, getBacklinks, extractLinks }
}
