import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  uploadBlob,
  protocolUrlToRelative,
  relativeToProtocolUrl,
  isAttachmentUrl,
  markdownProtocolToRelative,
  markdownRelativeToProtocol
} from '@renderer/services/attachment-client'

const saveMock = vi.fn()

beforeEach(() => {
  saveMock.mockReset()
  ;(globalThis as unknown as { window: { api: unknown } }).window = {
    api: { attachments: { save: saveMock } }
  }
})

describe('uploadBlob', () => {
  it('sends bytes + filename + mime to api.attachments.save', async () => {
    const payload = new Uint8Array([1, 2, 3])
    const blob = new Blob([payload], { type: 'image/png' })
    saveMock.mockResolvedValueOnce({
      url: 'yana-attachment://local/attachments/2026/04/x.png',
      relativePath: 'attachments/2026/04/x.png',
      size: 3
    })

    const ref = await uploadBlob(blob, 'my-shot.png')

    expect(saveMock).toHaveBeenCalledTimes(1)
    const call = saveMock.mock.calls[0][0] as {
      filename: string
      mime: string
      bytes: Uint8Array
    }
    expect(call.filename).toBe('my-shot.png')
    expect(call.mime).toBe('image/png')
    expect(Array.from(call.bytes)).toEqual([1, 2, 3])
    expect(ref.relativePath).toBe('attachments/2026/04/x.png')
  })

  it('falls back to an inferred filename when none is supplied', async () => {
    const blob = new Blob([new Uint8Array([9])], { type: 'image/png' })
    saveMock.mockResolvedValueOnce({
      url: 'yana-attachment://local/attachments/2026/04/y.png',
      relativePath: 'attachments/2026/04/y.png',
      size: 1
    })
    await uploadBlob(blob)

    const call = saveMock.mock.calls[0][0] as { filename: string; mime: string }
    expect(call.filename).toBe('screenshot.png')
    expect(call.mime).toBe('image/png')
  })

  it('defaults mime to application/octet-stream when blob has none', async () => {
    const blob = new Blob([new Uint8Array([0])])
    saveMock.mockResolvedValueOnce({ url: 'x', relativePath: 'x', size: 1 })
    await uploadBlob(blob, 'data')
    const call = saveMock.mock.calls[0][0] as { mime: string; filename: string }
    expect(call.mime).toBe('application/octet-stream')
    expect(call.filename).toBe('data')
  })
})

describe('url helpers', () => {
  it('strips the protocol prefix for on-disk storage', () => {
    expect(
      protocolUrlToRelative('yana-attachment://local/attachments/2026/04/foo.png')
    ).toBe('attachments/2026/04/foo.png')
  })

  it('leaves non-protocol URLs alone', () => {
    expect(protocolUrlToRelative('attachments/2026/04/foo.png')).toBe(
      'attachments/2026/04/foo.png'
    )
    expect(protocolUrlToRelative('https://example.com/x.png')).toBe('https://example.com/x.png')
  })

  it('rewrites a relative path back to a protocol URL', () => {
    expect(relativeToProtocolUrl('attachments/2026/04/foo.png')).toBe(
      'yana-attachment://local/attachments/2026/04/foo.png'
    )
  })

  it('is a no-op on already-rewritten protocol URLs', () => {
    const url = 'yana-attachment://local/attachments/x.png'
    expect(relativeToProtocolUrl(url)).toBe(url)
  })

  it('leaves foreign URLs alone in the rewriter', () => {
    expect(relativeToProtocolUrl('https://example.com/x.png')).toBe('https://example.com/x.png')
  })

  it('isAttachmentUrl catches both forms', () => {
    expect(isAttachmentUrl('yana-attachment://local/x')).toBe(true)
    expect(isAttachmentUrl('attachments/2026/04/x.png')).toBe(true)
    expect(isAttachmentUrl('https://example.com/x.png')).toBe(false)
  })
})

describe('markdown round-trip translators', () => {
  it('strips protocol prefix from image and link markdown on save', () => {
    const input = [
      '![cat](yana-attachment://local/attachments/2026/04/cat-abc123.png)',
      '[report](yana-attachment://local/attachments/2026/04/report-def456.pdf)',
      '[external](https://example.com/thing.png)'
    ].join('\n')

    const out = markdownProtocolToRelative(input)
    expect(out).toContain('![cat](attachments/2026/04/cat-abc123.png)')
    expect(out).toContain('[report](attachments/2026/04/report-def456.pdf)')
    expect(out).toContain('[external](https://example.com/thing.png)')
  })

  it('rewrites relative attachment paths back to protocol form on load', () => {
    const input = [
      '![cat](attachments/2026/04/cat.png)',
      '[report](attachments/2026/04/report.pdf)',
      '[external](https://example.com/thing.png)'
    ].join('\n')

    const out = markdownRelativeToProtocol(input)
    expect(out).toContain('![cat](yana-attachment://local/attachments/2026/04/cat.png)')
    expect(out).toContain('[report](yana-attachment://local/attachments/2026/04/report.pdf)')
    expect(out).toContain('[external](https://example.com/thing.png)')
  })

  it('is a full round-trip (save → load → save is idempotent)', () => {
    const source = '![x](attachments/2026/04/photo-aaa.png) and [y](attachments/2026/04/doc-bbb.pdf)'
    const round = markdownProtocolToRelative(markdownRelativeToProtocol(source))
    expect(round).toBe(source)
  })
})
