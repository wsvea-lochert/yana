import { describe, it, expect, afterEach } from 'vitest'
import { createInMemoryDatabase, type DatabaseInstance } from '@main/db/database'
import { runMigrations } from '@main/db/migrations'

describe('Database', () => {
  let db: DatabaseInstance

  afterEach(() => {
    db?.close()
  })

  it('creates in-memory database', () => {
    db = createInMemoryDatabase()
    const journalMode = db.pragma('journal_mode', { simple: true })
    // In-memory databases return 'memory' instead of 'wal'
    expect(journalMode).toBe('memory')
  })

  it('enables foreign keys', () => {
    db = createInMemoryDatabase()
    const fk = db.pragma('foreign_keys', { simple: true })
    expect(fk).toBe(1)
  })
})

describe('Migrations', () => {
  let db: DatabaseInstance

  afterEach(() => {
    db?.close()
  })

  it('creates all tables', () => {
    db = createInMemoryDatabase()
    runMigrations(db)

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[]

    const tableNames = tables.map((t) => t.name)
    expect(tableNames).toContain('notes')
    expect(tableNames).toContain('links')
  })

  it('creates FTS virtual table', () => {
    db = createInMemoryDatabase()
    runMigrations(db)

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='notes_fts'")
      .all()

    expect(tables).toHaveLength(1)
  })

  it('sets user_version to 1', () => {
    db = createInMemoryDatabase()
    runMigrations(db)
    const version = db.pragma('user_version', { simple: true })
    expect(version).toBe(1)
  })

  it('is idempotent', () => {
    db = createInMemoryDatabase()
    runMigrations(db)
    runMigrations(db)
    const version = db.pragma('user_version', { simple: true })
    expect(version).toBe(1)
  })

  it('supports FTS insert/delete triggers', () => {
    db = createInMemoryDatabase()
    runMigrations(db)

    db.prepare(
      "INSERT INTO notes (id, filename, title, created, modified, raw_content) VALUES ('n1', 'n1.md', 'Test', '2026-01-01', '2026-01-01', 'hello world')"
    ).run()

    const ftsResults = db
      .prepare("SELECT * FROM notes_fts WHERE notes_fts MATCH 'hello'")
      .all()
    expect(ftsResults).toHaveLength(1)

    db.prepare("DELETE FROM notes WHERE id = 'n1'").run()

    const ftsAfter = db
      .prepare("SELECT * FROM notes_fts WHERE notes_fts MATCH 'hello'")
      .all()
    expect(ftsAfter).toHaveLength(0)
  })
})
