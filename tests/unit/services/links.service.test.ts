import { describe, it, expect } from 'vitest'
import { createLinksService } from '@main/services/links.service'

describe('LinksService', () => {
  it('extracts wiki links from content', () => {
    const service = createLinksService()
    const links = service.extractLinks('Check [[note-a]] and [[note-b|display]]')
    expect(links).toEqual(['note-a', 'note-b'])
  })

  it('returns empty array for no links', () => {
    const service = createLinksService()
    const links = service.extractLinks('No links here')
    expect(links).toEqual([])
  })

  it('builds link graph and provides outgoing/backlinks', () => {
    const service = createLinksService()
    service.buildGraph([
      { id: 'a', content: 'Links to [[b]] and [[c]]' },
      { id: 'b', content: 'Links to [[a]]' },
      { id: 'c', content: 'No links' }
    ])

    expect(service.getOutgoingLinks('a')).toEqual(['b', 'c'])
    expect(service.getBacklinks('a')).toEqual(['b'])
    expect(service.getBacklinks('b')).toEqual(['a'])
    expect(service.getOutgoingLinks('c')).toEqual([])
  })

  it('handles notes with no links', () => {
    const service = createLinksService()
    service.buildGraph([{ id: 'lonely', content: 'Just text' }])
    expect(service.getOutgoingLinks('lonely')).toEqual([])
    expect(service.getBacklinks('lonely')).toEqual([])
  })
})
