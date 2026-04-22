import type { DatabaseInstance } from '../database'

export interface Migration {
  readonly version: number
  readonly name: string
  up(db: DatabaseInstance): void
}
