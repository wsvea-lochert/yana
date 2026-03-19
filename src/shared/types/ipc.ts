import type { NoteMetadata, Note, CreateNoteInput, UpdateNoteInput } from './note'
import type { SearchQuery, SearchResult } from './search'

export interface IpcChannelMap {
  'note:list': { request: void; response: readonly NoteMetadata[] }
  'note:get': { request: string; response: Note | null }
  'note:create': { request: CreateNoteInput; response: NoteMetadata }
  'note:update': { request: UpdateNoteInput; response: NoteMetadata }
  'note:delete': { request: string; response: void }
  'search:query': { request: SearchQuery; response: readonly SearchResult[] }
  'search:quick': { request: string; response: readonly SearchResult[] }
  'config:get': { request: string; response: unknown }
  'config:set': { request: { key: string; value: unknown }; response: void }
  'config:getVaultPath': { request: void; response: string }
  'overlay:hide': { request: void; response: void }
  'overlay:navigate': { request: string; response: void }
  'vault:changed': { request: never; response: NoteMetadata }
}

export type IpcChannel = keyof IpcChannelMap
