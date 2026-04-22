import { createHash } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { basename, extname, join } from 'path'
import { titleToSlug } from '@shared/utils/slug'
import {
  ATTACHMENT_DIR_NAME,
  ATTACHMENT_HOST,
  ATTACHMENT_PROTOCOL,
  MAX_ATTACHMENT_BYTES
} from '@shared/constants/defaults'
import { ensureInsideVault } from './path-guard'

export class AttachmentTooLargeError extends Error {
  constructor() {
    super('Attachment exceeds max size')
    this.name = 'AttachmentTooLargeError'
  }
}

function isExistsError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'EEXIST'
  )
}

export interface SavedAttachment {
  readonly relativePath: string
  readonly protocolUrl: string
  readonly size: number
  readonly hash: string
}

export interface AttachmentService {
  saveAttachment(input: {
    filename: string
    mime: string
    bytes: Uint8Array
  }): Promise<SavedAttachment>
  resolveToAbsolutePath(relativePath: string): string
}

// Minimal mime → extension map. Used only when filename has no usable
// extension (clipboard screenshots arrive as `image.png` / `image` or blobs
// with no name at all).
const MIME_EXT_MAP: Readonly<Record<string, string>> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
  'image/heic': 'heic',
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'application/json': 'json',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'video/mp4': 'mp4',
  'video/webm': 'webm'
}

function deriveExt(filename: string, mime: string): string {
  const raw = extname(filename).replace(/^\./, '').toLowerCase()
  if (/^[a-z0-9]{1,8}$/.test(raw)) return raw
  const mapped = MIME_EXT_MAP[mime]
  if (mapped) return mapped
  return 'bin'
}

function deriveSlug(filename: string): string {
  const stem = basename(filename, extname(filename)).trim()
  const slug = titleToSlug(stem)
  if (slug) return slug
  return 'attachment'
}

function buildRelativePath(slug: string, hash: string, ext: string, date: Date): string {
  const yyyy = String(date.getFullYear())
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `${ATTACHMENT_DIR_NAME}/${yyyy}/${mm}/${slug}-${hash}.${ext}`
}

function buildProtocolUrl(relativePath: string): string {
  return `${ATTACHMENT_PROTOCOL}://${ATTACHMENT_HOST}/${relativePath}`
}

export function createAttachmentService(
  vaultPath: string,
  now: () => Date = () => new Date()
): AttachmentService {
  async function saveAttachment(input: {
    filename: string
    mime: string
    bytes: Uint8Array
  }): Promise<SavedAttachment> {
    if (input.bytes.length > MAX_ATTACHMENT_BYTES) {
      throw new AttachmentTooLargeError()
    }

    const hash = createHash('sha256').update(input.bytes).digest('hex').slice(0, 8)
    const slug = deriveSlug(input.filename)
    const ext = deriveExt(input.filename, input.mime)
    const relativePath = buildRelativePath(slug, hash, ext, now())

    // Guard against traversal even though the inputs above are derived from
    // our slug — never trust construction correctness blindly.
    const absolutePath = ensureInsideVault(vaultPath, relativePath)

    if (!existsSync(absolutePath)) {
      await mkdir(join(absolutePath, '..'), { recursive: true })
      try {
        // 'wx' fails if the file now exists — closes the TOCTOU window and
        // is still a no-op when two callers race on identical bytes (dedup).
        await writeFile(absolutePath, input.bytes, { flag: 'wx' })
      } catch (error) {
        if (!isExistsError(error)) throw error
      }
    }

    return {
      relativePath,
      protocolUrl: buildProtocolUrl(relativePath),
      size: input.bytes.length,
      hash
    }
  }

  function resolveToAbsolutePath(relativePath: string): string {
    return ensureInsideVault(vaultPath, relativePath)
  }

  return { saveAttachment, resolveToAbsolutePath }
}
