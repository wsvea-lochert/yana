import type { DatabaseInstance } from './database'
import { ALL_SCHEMA_STATEMENTS } from './schema'

const CURRENT_VERSION = 1

export function runMigrations(db: DatabaseInstance): void {
  const currentVersion = db.pragma('user_version', { simple: true }) as number

  if (currentVersion < 1) {
    db.transaction(() => {
      for (const statement of ALL_SCHEMA_STATEMENTS) {
        db.exec(statement)
      }
      db.pragma(`user_version = ${CURRENT_VERSION}`)
    })()
  }
}
