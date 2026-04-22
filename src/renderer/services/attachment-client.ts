import {
  ATTACHMENT_DIR_NAME,
  ATTACHMENT_HOST,
  ATTACHMENT_PROTOCOL
} from '@shared/constants/defaults'
import type { SavedAttachmentRef } from '@shared/types/electron-env'

/**
 * Thin wrapper around the preload-exposed attachments API. Accepts a browser
 * Blob/File and converts to Uint8Array for structured-clone transfer.
 */
export async function uploadBlob(
  blob: Blob,
  suggestedName?: string
): Promise<SavedAttachmentRef> {
  const buffer = typeof blob.arrayBuffer === 'function'
    ? await blob.arrayBuffer()
    : await new Response(blob).arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const filename = suggestedName?.trim() || inferFilenameFromMime(blob.type)
  const mime = blob.type || 'application/octet-stream'
  return window.api.attachments.save({ filename, mime, bytes })
}

function inferFilenameFromMime(mime: string): string {
  if (mime.startsWith('image/')) return `screenshot.${mime.split('/')[1] || 'png'}`
  if (mime.startsWith('video/')) return `clip.${mime.split('/')[1] || 'mp4'}`
  if (mime.startsWith('audio/')) return `clip.${mime.split('/')[1] || 'mp3'}`
  return 'file.bin'
}

const PROTOCOL_PREFIX = `${ATTACHMENT_PROTOCOL}://${ATTACHMENT_HOST}/`

/**
 * Convert a runtime protocol URL to the portable relative form that lives on
 * disk inside markdown files. Returns the input unchanged if it doesn't look
 * like one of ours.
 */
export function protocolUrlToRelative(url: string): string {
  if (url.startsWith(PROTOCOL_PREFIX)) {
    return url.slice(PROTOCOL_PREFIX.length)
  }
  return url
}

/**
 * Convert a relative attachments/... path (as stored in markdown) to the
 * runtime protocol URL used by <img src> / <a href>.
 */
export function relativeToProtocolUrl(relativePath: string): string {
  if (relativePath.startsWith(`${ATTACHMENT_PROTOCOL}:`)) return relativePath
  if (relativePath.startsWith(`${ATTACHMENT_DIR_NAME}/`)) {
    return `${PROTOCOL_PREFIX}${relativePath}`
  }
  return relativePath
}

export function isAttachmentUrl(url: string): boolean {
  return url.startsWith(`${ATTACHMENT_PROTOCOL}:`) || url.startsWith(`${ATTACHMENT_DIR_NAME}/`)
}

const PROTOCOL_URL_RE = new RegExp(
  `${ATTACHMENT_PROTOCOL}://${ATTACHMENT_HOST}/(${ATTACHMENT_DIR_NAME}/[A-Za-z0-9/_.\\-]+)`,
  'g'
)

// Matches ![alt](attachments/...) or [text](attachments/...) where the URL
// is a bare relative attachment path (no scheme).
const RELATIVE_LINK_RE = new RegExp(
  `(!?\\[[^\\]]*\\]\\()(${ATTACHMENT_DIR_NAME}/[A-Za-z0-9/_.\\-]+)(\\))`,
  'g'
)

/**
 * Markdown written to disk uses portable relative paths so external editors
 * can still see the image. Applied right before `updateNote`.
 */
export function markdownProtocolToRelative(markdown: string): string {
  return markdown.replace(PROTOCOL_URL_RE, '$1')
}

/**
 * Markdown loaded from disk is rewritten to protocol URLs so <img src> can
 * fetch via the registered handler. Applied before `editor.setContent`.
 */
export function markdownRelativeToProtocol(markdown: string): string {
  return markdown.replace(RELATIVE_LINK_RE, (_m, open, path, close) => {
    return `${open}${PROTOCOL_PREFIX}${path}${close}`
  })
}
