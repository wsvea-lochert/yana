import { describe, it, expect } from 'vitest'
import { createInMemoryDatabase } from '@main/db/database'
import { runMigrations, ALL_MIGRATIONS } from '@main/db/migrations'

describe('migrations', () => {
  it('applies all migrations on fresh DB and sets user_version', () => {
    const db = createInMemoryDatabase()
    runMigrations(db)
    const version = db.pragma('user_version', { simple: true }) as number
    expect(version).toBe(ALL_MIGRATIONS[ALL_MIGRATIONS.length - 1].version)
    db.close()
  })

  it('is idempotent — running twice is a no-op', () => {
    const db = createInMemoryDatabase()
    runMigrations(db)
    const firstVersion = db.pragma('user_version', { simple: true }) as number
    runMigrations(db)
    const secondVersion = db.pragma('user_version', { simple: true }) as number
    expect(secondVersion).toBe(firstVersion)
    db.close()
  })

  it('creates notes and links tables', () => {
    const db = createInMemoryDatabase()
    runMigrations(db)
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as { name: string }[]
    const names = tables.map((t) => t.name)
    expect(names).toContain('notes')
    expect(names).toContain('links')
    db.close()
  })

  it('only runs pending migrations when some already applied', () => {
    const db = createInMemoryDatabase()
    // Pretend DB is already at version 1
    runMigrations(db, [ALL_MIGRATIONS[0]])
    expect(db.pragma('user_version', { simple: true })).toBe(1)

    // Now run all — only migration 002 should execute
    runMigrations(db)
    expect(db.pragma('user_version', { simple: true })).toBe(2)
    db.close()
  })

  it('does nothing when DB is already at latest version', () => {
    const db = createInMemoryDatabase()
    runMigrations(db)
    const before = db.pragma('user_version', { simple: true }) as number
    runMigrations(db)
    const after = db.pragma('user_version', { simple: true }) as number
    expect(after).toBe(before)
    db.close()
  })
})
