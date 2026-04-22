import type { DatabaseInstance } from '../database'
import type { Migration } from './types'
import { migration001Init } from './001-init'
import { migration002ChecksumDefault } from './002-checksum-default'

export const ALL_MIGRATIONS: readonly Migration[] = [
  migration001Init,
  migration002ChecksumDefault
]

export function runMigrations(
  db: DatabaseInstance,
  migrations: readonly Migration[] = ALL_MIGRATIONS
): void {
  const currentVersion = db.pragma('user_version', { simple: true }) as number
  const pending = migrations.filter((m) => m.version > currentVersion)
  if (pending.length === 0) return

  const sorted = [...pending].sort((a, b) => a.version - b.version)
  const targetVersion = sorted[sorted.length - 1].version

  db.transaction(() => {
    for (const migration of sorted) {
      migration.up(db)
    }
    db.pragma(`user_version = ${targetVersion}`)
  })()
}
