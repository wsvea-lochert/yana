import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

/**
 * Tests the handler as if it were invoked by IPC — we stand up a real
 * AttachmentService against a temp vault and invoke the registered ipcMain
 * handler directly.
 */
type IpcHandler = (event: { sender: { id: number } }, input: unknown) => unknown
const handlers = new Map<string, IpcHandler>()

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: IpcHandler) => {
      handlers.set(channel, handler)
    }
  }
}))

import { registerAttachmentHandlers } from '@main/ipc/attachment-handlers'
import { createAttachmentService } from '@main/services/attachment.service'
import { CHANNELS } from '@shared/constants/channels'
import { MAX_ATTACHMENT_BYTES } from '@shared/constants/defaults'

describe('attachment-handlers integration', () => {
  let vaultPath: string

  beforeEach(() => {
    handlers.clear()
    vaultPath = mkdtempSync(join(tmpdir(), 'yana-ipc-att-'))
    const svc = createAttachmentService(vaultPath, () => new Date('2026-04-22T10:00:00Z'))
    registerAttachmentHandlers(svc)
  })

  afterEach(() => {
    rmSync(vaultPath, { recursive: true, force: true })
  })

  function call(input: unknown) {
    const handler = handlers.get(CHANNELS.ATTACHMENT_SAVE)
    if (!handler) throw new Error('handler not registered')
    return handler({ sender: { id: 0 } }, input)
  }

  it('writes a valid attachment and returns a protocol URL + relative path', async () => {
    const bytes = new Uint8Array([10, 20, 30])
    const result = (await call({
      filename: 'note-image.png',
      mime: 'image/png',
      bytes
    })) as { url: string; relativePath: string; size: number }

    expect(result.url).toMatch(/^yana-attachment:\/\/local\/attachments\/2026\/04\//)
    expect(result.relativePath).toMatch(/^attachments\/2026\/04\/note-image-[0-9a-f]{8}\.png$/)
    expect(result.size).toBe(3)
    expect(existsSync(join(vaultPath, result.relativePath))).toBe(true)
  })

  it('rejects oversized payloads via schema validation', async () => {
    const tooBig = new Uint8Array(MAX_ATTACHMENT_BYTES + 1)
    await expect(
      call({ filename: 'big.bin', mime: 'application/octet-stream', bytes: tooBig })
    ).rejects.toThrow(/Invalid input for attachment:save/)
  })

  it('rejects non-schema input with generic validation error', async () => {
    await expect(call({ filename: 'x.png' })).rejects.toThrow(/Invalid input for attachment:save/)
    await expect(call(null)).rejects.toThrow(/Invalid input for attachment:save/)
    await expect(
      call({ filename: 'x.png', mime: 'not-mime', bytes: new Uint8Array([1]) })
    ).rejects.toThrow(/Invalid input for attachment:save/)
  })

  it('is idempotent for identical bytes (dedup)', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5])
    const first = (await call({
      filename: 'dup.png',
      mime: 'image/png',
      bytes
    })) as { relativePath: string }
    const second = (await call({
      filename: 'dup.png',
      mime: 'image/png',
      bytes
    })) as { relativePath: string }
    expect(second.relativePath).toBe(first.relativePath)
  })
})
