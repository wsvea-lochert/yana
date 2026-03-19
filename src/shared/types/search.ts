export interface SearchQuery {
  readonly term: string
  readonly limit?: number
  readonly tags?: readonly string[]
}

export interface SearchResult {
  readonly id: string
  readonly title: string
  readonly excerpt: string
  readonly score: number
  readonly matchType: 'title' | 'content' | 'both'
  readonly tags: readonly string[]
  readonly modified: string
}

export interface FtsResult {
  readonly id: string
  readonly title: string
  readonly rawContent: string
  readonly tags: string
  readonly rank: number
}
