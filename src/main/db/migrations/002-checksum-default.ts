import type { DatabaseInstance } from '../database'
import type { Migration } from './types'

export const migration002ChecksumDefault: Migration = {
  version: 2,
  name: '002-checksum-default',
  up(db: DatabaseInstance): void {
    // Backfill NULL checksums on existing rows so later code can treat
    // checksum as a non-null string. Fresh DBs have no rows so this is a no-op.
    db.exec("UPDATE notes SET checksum = '' WHERE checksum IS NULL")
  }
}
