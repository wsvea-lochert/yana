export const CREATE_NOTES_TABLE = `
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    title TEXT NOT NULL,
    created TEXT NOT NULL,
    modified TEXT NOT NULL,
    excerpt TEXT NOT NULL DEFAULT '',
    word_count INTEGER NOT NULL DEFAULT 0,
    tags TEXT NOT NULL DEFAULT '[]',
    links TEXT NOT NULL DEFAULT '[]',
    raw_content TEXT NOT NULL DEFAULT '',
    checksum TEXT
  )
`

export const CREATE_NOTES_FTS = `
  CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
    title,
    raw_content,
    tags,
    content=notes,
    content_rowid=rowid,
    tokenize='porter unicode61'
  )
`

export const CREATE_FTS_INSERT_TRIGGER = `
  CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
    INSERT INTO notes_fts(rowid, title, raw_content, tags)
    VALUES (new.rowid, new.title, new.raw_content, new.tags);
  END
`

export const CREATE_FTS_DELETE_TRIGGER = `
  CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
    INSERT INTO notes_fts(notes_fts, rowid, title, raw_content, tags)
    VALUES ('delete', old.rowid, old.title, old.raw_content, old.tags);
  END
`

export const CREATE_FTS_UPDATE_TRIGGER = `
  CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
    INSERT INTO notes_fts(notes_fts, rowid, title, raw_content, tags)
    VALUES ('delete', old.rowid, old.title, old.raw_content, old.tags);
    INSERT INTO notes_fts(rowid, title, raw_content, tags)
    VALUES (new.rowid, new.title, new.raw_content, new.tags);
  END
`

export const CREATE_LINKS_TABLE = `
  CREATE TABLE IF NOT EXISTS links (
    source_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    context TEXT,
    PRIMARY KEY (source_id, target_id),
    FOREIGN KEY (source_id) REFERENCES notes(id) ON DELETE CASCADE
  )
`

export const CREATE_LINKS_SOURCE_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_links_source ON links(source_id)
`

export const CREATE_LINKS_TARGET_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_id)
`

export const ALL_SCHEMA_STATEMENTS = [
  CREATE_NOTES_TABLE,
  CREATE_NOTES_FTS,
  CREATE_FTS_INSERT_TRIGGER,
  CREATE_FTS_DELETE_TRIGGER,
  CREATE_FTS_UPDATE_TRIGGER,
  CREATE_LINKS_TABLE,
  CREATE_LINKS_SOURCE_INDEX,
  CREATE_LINKS_TARGET_INDEX
] as const
