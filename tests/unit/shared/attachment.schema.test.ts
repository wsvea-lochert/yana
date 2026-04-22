import { describe, it, expect } from 'vitest'
import {
  SaveAttachmentInputSchema,
  AttachmentResolveInputSchema
} from '@shared/schemas/attachment.schema'
import { MAX_ATTACHMENT_BYTES } from '@shared/constants/defaults'

describe('SaveAttachmentInputSchema', () => {
  const validBytes = new Uint8Array([1, 2, 3, 4])

  it('accepts a valid image payload', () => {
    const parsed = SaveAttachmentInputSchema.parse({
      filename: 'photo.png',
      mime: 'image/png',
      bytes: validBytes
    })
    expect(parsed.filename).toBe('photo.png')
    expect(parsed.mime).toBe('image/png')
    expect(parsed.bytes).toBe(validBytes)
  })

  it('rejects empty filename', () => {
    expect(() =>
      SaveAttachmentInputSchema.parse({ filename: '', mime: 'image/png', bytes: validBytes })
    ).toThrow()
  })

  it('rejects filename over 255 chars', () => {
    expect(() =>
      SaveAttachmentInputSchema.parse({
        filename: 'a'.repeat(256),
        mime: 'image/png',
        bytes: validBytes
      })
    ).toThrow()
  })

  it('rejects malformed mime', () => {
    expect(() =>
      SaveAttachmentInputSchema.parse({
        filename: 'a.png',
        mime: 'not-a-mime',
        bytes: validBytes
      })
    ).toThrow()
  })

  it('rejects empty bytes', () => {
    expect(() =>
      SaveAttachmentInputSchema.parse({
        filename: 'a.png',
        mime: 'image/png',
        bytes: new Uint8Array(0)
      })
    ).toThrow()
  })

  it('rejects bytes over the size cap', () => {
    const tooBig = new Uint8Array(MAX_ATTACHMENT_BYTES + 1)
    expect(() =>
      SaveAttachmentInputSchema.parse({ filename: 'a.png', mime: 'image/png', bytes: tooBig })
    ).toThrow()
  })

  it('rejects non-Uint8Array bytes', () => {
    expect(() =>
      SaveAttachmentInputSchema.parse({
        filename: 'a.png',
        mime: 'image/png',
        bytes: [1, 2, 3] as unknown as Uint8Array
      })
    ).toThrow()
  })
})

describe('AttachmentResolveInputSchema', () => {
  it('accepts a nested relative path', () => {
    const parsed = AttachmentResolveInputSchema.parse('attachments/2026/04/photo-abc123.png')
    expect(parsed).toContain('photo-abc123.png')
  })

  it('rejects paths with traversal characters', () => {
    expect(() => AttachmentResolveInputSchema.parse('../etc/passwd')).toThrow()
  })

  it('rejects empty string', () => {
    expect(() => AttachmentResolveInputSchema.parse('')).toThrow()
  })

  it('rejects paths with spaces', () => {
    expect(() => AttachmentResolveInputSchema.parse('attachments/my file.png')).toThrow()
  })
})
