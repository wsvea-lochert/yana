import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { createVaultService } from '@main/services/vault.service'
import { createInMemoryDatabase, type DatabaseInstance } from '@main/db/database'
import { runMigrations } from '@main/db/migrations'
import { createIndexService } from '@main/services/index.service'
import { createSearchService } from '@main/services/search.service'

describe('Note handlers integration', () => {
  let vaultPath: string
  let db: DatabaseInstance
  let vaultService: ReturnType<typeof createVaultService>
  let indexService: ReturnType<typeof createIndexService>
  let searchService: ReturnType<typeof createSearchService>

  beforeEach(async () => {
    vaultPath = mkdtempSync(join(tmpdir(), 'quicknote-ipc-'))
    db = createInMemoryDatabase()
    runMigrations(db)

    vaultService = createVaultService(vaultPath)
    indexService = createIndexService(db)
    searchService = createSearchService(db)
  })

  afterEach(() => {
    vaultService.stopWatching()
    db.close()
    rmSync(vaultPath, { recursive: true, force: true })
  })

  it('complete CRUD cycle: create → get → list → update → search → delete', async () => {
    // Create
    const created = await vaultService.createNote({
      title: 'Integration Test Note',
      content: 'This is searchable content about architecture',
      tags: ['testing']
    })
    expect(created.id).toBe('integration-test-note')
    expect(created.title).toBe('Integration Test Note')

    // Index it
    const note = await vaultService.getNote(created.id)
    expect(note).not.toBeNull()
    indexService.indexNote(created, note!.content)

    // Rebuild fuse
    const allNotes = await vaultService.listNotes()
    searchService.rebuildFuseIndex(allNotes)

    // List
    const listed = await vaultService.listNotes()
    expect(listed).toHaveLength(1)
    expect(listed[0].title).toBe('Integration Test Note')

    // Get
    const fetched = await vaultService.getNote('integration-test-note')
    expect(fetched).not.toBeNull()
    expect(fetched!.content).toBe('This is searchable content about architecture')
    expect(fetched!.frontmatter.tags).toEqual(['testing'])

    // Update
    const updated = await vaultService.updateNote({
      id: 'integration-test-note',
      content: 'Updated content about design patterns',
      tags: ['testing', 'updated']
    })
    expect(updated.tags).toEqual(['testing', 'updated'])

    // Re-index
    const updatedNote = await vaultService.getNote(updated.id)
    indexService.indexNote(updated, updatedNote!.content)
    const notesAfterUpdate = await vaultService.listNotes()
    searchService.rebuildFuseIndex(notesAfterUpdate)

    // Search FTS
    const contentResults = searchService.searchContent('design')
    expect(contentResults.length).toBeGreaterThan(0)
    expect(contentResults[0].id).toBe('integration-test-note')

    // Search fuzzy title
    const titleResults = searchService.searchTitles('integation') // intentional typo for fuzzy
    expect(titleResults.length).toBeGreaterThan(0)

    // Combined search
    const combined = searchService.search({ term: 'design' })
    expect(combined.length).toBeGreaterThan(0)

    // Delete
    await vaultService.deleteNote('integration-test-note')
    indexService.removeNote('integration-test-note')

    const afterDelete = await vaultService.listNotes()
    expect(afterDelete).toHaveLength(0)

    const searchAfterDelete = searchService.searchContent('design')
    expect(searchAfterDelete).toHaveLength(0)
  })

  it('handles multiple notes with wiki links', async () => {
    await vaultService.createNote({
      title: 'Note Alpha',
      content: 'Links to [[note-beta]] for reference'
    })
    await vaultService.createNote({
      title: 'Note Beta',
      content: 'Links back to [[note-alpha]]'
    })

    const alpha = await vaultService.getNote('note-alpha')
    const beta = await vaultService.getNote('note-beta')

    expect(alpha!.links).toEqual(['note-beta'])
    expect(beta!.links).toEqual(['note-alpha'])
  })

  it('indexes and searches across multiple notes', async () => {
    const notesData = [
      { title: 'React Hooks Guide', content: 'Learn about useState and useEffect', tags: ['react'] },
      { title: 'TypeScript Tips', content: 'Advanced typescript patterns', tags: ['typescript'] },
      { title: 'CSS Grid Layout', content: 'Modern CSS grid techniques', tags: ['css'] }
    ]

    for (const data of notesData) {
      const meta = await vaultService.createNote(data)
      const full = await vaultService.getNote(meta.id)
      indexService.indexNote(meta, full!.content)
    }

    const allNotes = await vaultService.listNotes()
    searchService.rebuildFuseIndex(allNotes)

    const reactResults = searchService.search({ term: 'react' })
    expect(reactResults.length).toBeGreaterThan(0)
    expect(reactResults[0].id).toBe('react-hooks-guide')

    const cssResults = searchService.search({ term: 'grid' })
    expect(cssResults.length).toBeGreaterThan(0)
  })
})
