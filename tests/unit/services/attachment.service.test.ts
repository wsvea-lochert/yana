import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import {
  createAttachmentService,
  AttachmentTooLargeError
} from '@main/services/attachment.service'
import { VaultPathEscapeError } from '@main/services/path-guard'
import { MAX_ATTACHMENT_BYTES } from '@shared/constants/defaults'

describe('attachment.service', () => {
  let vaultPath: string

  beforeEach(() => {
    vaultPath = mkdtempSync(join(tmpdir(), 'yana-att-'))
  })

  afterEach(() => {
    rmSync(vaultPath, { recursive: true, force: true })
  })

  it('writes an image under attachments/YYYY/MM/<slug>-<hash>.<ext>', async () => {
    const svc = createAttachmentService(vaultPath, () => new Date('2026-04-22T12:00:00Z'))
    const bytes = new Uint8Array([1, 2, 3, 4, 5])

    const saved = await svc.saveAttachment({
      filename: 'My Photo.PNG',
      mime: 'image/png',
      bytes
    })

    expect(saved.relativePath).toMatch(/^attachments\/2026\/04\/my-photo-[0-9a-f]{8}\.png$/)
    expect(saved.protocolUrl).toBe(`yana-attachment://local/${saved.relativePath}`)
    expect(saved.size).toBe(5)
    expect(saved.hash).toMatch(/^[0-9a-f]{8}$/)
    expect(existsSync(join(vaultPath, saved.relativePath))).toBe(true)
    expect(readFileSync(join(vaultPath, saved.relativePath))).toEqual(Buffer.from(bytes))
  })

  it('dedupes identical bytes (same hash, no rewrite)', async () => {
    const svc = createAttachmentService(vaultPath, () => new Date('2026-04-22T12:00:00Z'))
    const bytes = new Uint8Array([9, 9, 9])

    const first = await svc.saveAttachment({
      filename: 'a.png',
      mime: 'image/png',
      bytes
    })
    const second = await svc.saveAttachment({
      filename: 'a.png',
      mime: 'image/png',
      bytes
    })

    expect(second.relativePath).toBe(first.relativePath)
    expect(second.hash).toBe(first.hash)
  })

  it('falls back to mime when filename has no usable extension', async () => {
    const svc = createAttachmentService(vaultPath, () => new Date('2026-04-22T12:00:00Z'))
    const saved = await svc.saveAttachment({
      filename: 'image',
      mime: 'image/png',
      bytes: new Uint8Array([1])
    })
    expect(saved.relativePath).toMatch(/\.png$/)
  })

  it('falls back to "attachment" when filename slugifies to empty', async () => {
    const svc = createAttachmentService(vaultPath, () => new Date('2026-04-22T12:00:00Z'))
    const saved = await svc.saveAttachment({
      filename: '???.png',
      mime: 'image/png',
      bytes: new Uint8Array([1])
    })
    expect(saved.relativePath).toMatch(/\/attachment-[0-9a-f]{8}\.png$/)
  })

  it('uses .bin when mime is unknown and filename has no extension', async () => {
    const svc = createAttachmentService(vaultPath, () => new Date('2026-04-22T12:00:00Z'))
    const saved = await svc.saveAttachment({
      filename: 'unknown',
      mime: 'application/x-unknown-format',
      bytes: new Uint8Array([1])
    })
    expect(saved.relativePath).toMatch(/\.bin$/)
  })

  it('rejects payloads over the size cap', async () => {
    const svc = createAttachmentService(vaultPath)
    const tooBig = new Uint8Array(MAX_ATTACHMENT_BYTES + 1)
    await expect(
      svc.saveAttachment({ filename: 'big.bin', mime: 'application/octet-stream', bytes: tooBig })
    ).rejects.toBeInstanceOf(AttachmentTooLargeError)
  })

  it('resolveToAbsolutePath rejects traversal', () => {
    const svc = createAttachmentService(vaultPath)
    expect(() => svc.resolveToAbsolutePath('../etc/passwd')).toThrow(VaultPathEscapeError)
  })

  it('resolveToAbsolutePath accepts nested attachment paths', () => {
    const svc = createAttachmentService(vaultPath)
    expect(svc.resolveToAbsolutePath('attachments/2026/04/foo.png')).toBe(
      join(vaultPath, 'attachments/2026/04/foo.png')
    )
  })
})
