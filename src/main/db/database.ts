import Database from 'better-sqlite3'

export type DatabaseInstance = Database.Database

export function createDatabase(dbPath: string): DatabaseInstance {
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  return db
}

export function createInMemoryDatabase(): DatabaseInstance {
  const db = new Database(':memory:')
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  return db
}
