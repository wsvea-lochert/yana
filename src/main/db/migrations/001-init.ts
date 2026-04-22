import type { DatabaseInstance } from '../database'
import { ALL_SCHEMA_STATEMENTS } from '../schema'
import type { Migration } from './types'

export const migration001Init: Migration = {
  version: 1,
  name: '001-init',
  up(db: DatabaseInstance): void {
    for (const statement of ALL_SCHEMA_STATEMENTS) {
      db.exec(statement)
    }
  }
}
