import { readFile, writeFile, readdir, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, basename, extname } from 'path'
import matter from 'gray-matter'
import { watch, type FSWatcher } from 'chokidar'
import { titleToSlug } from '@shared/utils/slug'
import { toISOString } from '@shared/utils/date'
import { CreateNoteInputSchema, UpdateNoteInputSchema } from '@shared/schemas/note.schema'
import { MAX_EXCERPT_LENGTH, CHOKIDAR_STABILITY_THRESHOLD } from '@shared/constants/defaults'
import type { NoteMetadata, Note, CreateNoteInput, UpdateNoteInput, Frontmatter } from '@shared/types/note'

export interface VaultEvent {
  readonly type: 'add' | 'change' | 'unlink'
  readonly id: string
  readonly path: string
}

export interface VaultService {
  listNotes(): Promise<readonly NoteMetadata[]>
  getNote(id: string): Promise<Note | null>
  createNote(input: CreateNoteInput): Promise<NoteMetadata>
  updateNote(input: UpdateNoteInput): Promise<NoteMetadata>
  deleteNote(id: string): Promise<void>
  startWatching(onChange: (event: VaultEvent) => void): void
  stopWatching(): void
}

function extractExcerpt(content: string): string {
  const cleaned = content
    .replace(/^#{1,6}\s+.*$/gm, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .trim()
  return cleaned.length > MAX_EXCERPT_LENGTH
    ? cleaned.slice(0, MAX_EXCERPT_LENGTH).trim() + '...'
    : cleaned
}

function countWords(content: string): number {
  return content.split(/\s+/).filter((w) => w.length > 0).length
}

function extractLinks(content: string): readonly string[] {
  const regex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g
  const links: string[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(content)) !== null) {
    links.push(match[1].trim())
  }
  return links
}

function filenameToId(filename: string): string {
  return basename(filename, extname(filename))
}

function parseNoteFile(
  filePath: string,
  rawContent: string
): { frontmatter: Frontmatter; content: string } {
  const { data, content } = matter(rawContent)
  return {
    frontmatter: {
      title: (data.title as string) ?? filenameToId(filePath),
      created: (data.created as string) ?? toISOString(),
      modified: (data.modified as string) ?? toISOString(),
      tags: (data.tags as string[]) ?? [],
      aliases: (data.aliases as string[]) ?? []
    },
    content: content.trim()
  }
}

export function createVaultService(vaultPath: string): VaultService {
  let watcher: FSWatcher | null = null

  async function ensureVaultExists(): Promise<void> {
    if (!existsSync(vaultPath)) {
      await mkdir(vaultPath, { recursive: true })
    }
  }

  async function listNotes(): Promise<readonly NoteMetadata[]> {
    await ensureVaultExists()
    const files = await readdir(vaultPath)
    const mdFiles = files.filter((f) => f.endsWith('.md'))

    const notes = await Promise.all(
      mdFiles.map(async (filename) => {
        const filePath = join(vaultPath, filename)
        const raw = await readFile(filePath, 'utf-8')
        const { frontmatter, content } = parseNoteFile(filePath, raw)
        const id = filenameToId(filename)

        return {
          id,
          filename,
          title: frontmatter.title,
          created: frontmatter.created,
          modified: frontmatter.modified,
          tags: frontmatter.tags,
          excerpt: extractExcerpt(content),
          wordCount: countWords(content)
        } as NoteMetadata
      })
    )

    return notes
  }

  async function getNote(id: string): Promise<Note | null> {
    const filePath = join(vaultPath, `${id}.md`)
    if (!existsSync(filePath)) return null

    const raw = await readFile(filePath, 'utf-8')
    const { frontmatter, content } = parseNoteFile(filePath, raw)

    return {
      id,
      filename: `${id}.md`,
      frontmatter,
      content,
      rawContent: raw,
      links: extractLinks(content),
      backlinks: []
    }
  }

  async function createNote(input: CreateNoteInput): Promise<NoteMetadata> {
    const validated = CreateNoteInputSchema.parse(input)
    await ensureVaultExists()

    const slug = titleToSlug(validated.title)
    const now = toISOString()

    let filename = `${slug}.md`
    let filePath = join(vaultPath, filename)
    let uniqueSlug = slug
    let counter = 1
    while (existsSync(filePath)) {
      uniqueSlug = `${slug}-${counter}`
      filename = `${uniqueSlug}.md`
      filePath = join(vaultPath, filename)
      counter++
    }

    const frontmatterData = {
      title: validated.title,
      created: now,
      modified: now,
      tags: validated.tags ?? [],
      aliases: []
    }

    const body = validated.content ?? ''
    const fileContent = matter.stringify(body, frontmatterData)
    await writeFile(filePath, fileContent, 'utf-8')

    return {
      id: uniqueSlug,
      filename,
      title: validated.title,
      created: now,
      modified: now,
      tags: validated.tags ?? [],
      excerpt: extractExcerpt(body),
      wordCount: countWords(body)
    }
  }

  async function updateNote(input: UpdateNoteInput): Promise<NoteMetadata> {
    const validated = UpdateNoteInputSchema.parse(input)
    const existing = await getNote(validated.id)
    if (!existing) {
      throw new Error(`Note not found: ${validated.id}`)
    }

    const now = toISOString()
    const updatedFrontmatter = {
      ...existing.frontmatter,
      ...(validated.title !== undefined ? { title: validated.title } : {}),
      ...(validated.tags !== undefined ? { tags: validated.tags } : {}),
      modified: now
    }

    const content = validated.content ?? existing.content
    const fileContent = matter.stringify(content, { ...updatedFrontmatter })
    const filePath = join(vaultPath, existing.filename)
    await writeFile(filePath, fileContent, 'utf-8')

    return {
      id: validated.id,
      filename: existing.filename,
      title: updatedFrontmatter.title,
      created: updatedFrontmatter.created,
      modified: now,
      tags: updatedFrontmatter.tags,
      excerpt: extractExcerpt(content),
      wordCount: countWords(content)
    }
  }

  async function deleteNote(id: string): Promise<void> {
    const filePath = join(vaultPath, `${id}.md`)
    if (existsSync(filePath)) {
      await unlink(filePath)
    }
  }

  function startWatching(onChange: (event: VaultEvent) => void): void {
    watcher = watch(join(vaultPath, '*.md'), {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: CHOKIDAR_STABILITY_THRESHOLD }
    })

    const toEvent = (type: VaultEvent['type']) => (path: string) => {
      const id = filenameToId(path)
      onChange({ type, id, path })
    }

    watcher.on('add', toEvent('add'))
    watcher.on('change', toEvent('change'))
    watcher.on('unlink', toEvent('unlink'))
  }

  function stopWatching(): void {
    watcher?.close()
    watcher = null
  }

  return { listNotes, getNote, createNote, updateNote, deleteNote, startWatching, stopWatching }
}
