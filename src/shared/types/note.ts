export interface Frontmatter {
  readonly title: string
  readonly created: string
  readonly modified: string
  readonly tags: readonly string[]
  readonly aliases: readonly string[]
  readonly folder: string
}

export interface NoteMetadata {
  readonly id: string
  readonly filename: string
  readonly title: string
  readonly created: string
  readonly modified: string
  readonly tags: readonly string[]
  readonly excerpt: string
  readonly wordCount: number
  readonly folder: string
}

export interface Note {
  readonly id: string
  readonly filename: string
  readonly frontmatter: Frontmatter
  readonly content: string
  readonly rawContent: string
  readonly links: readonly string[]
  readonly backlinks: readonly string[]
}

export interface CreateNoteInput {
  readonly title: string
  readonly content?: string
  readonly tags?: readonly string[]
  readonly folder?: string
}

export interface UpdateNoteInput {
  readonly id: string
  readonly title?: string
  readonly content?: string
  readonly tags?: readonly string[]
  readonly folder?: string
}
