import { describe, it, expect, vi, beforeEach } from 'vitest'

type ProtocolHandler = (request: { url: string }) => Promise<Response> | Response

const handlers = new Map<string, ProtocolHandler>()
const fetchMock = vi.fn<(url: string) => Promise<Response>>()
const registerSchemesAsPrivilegedMock = vi.fn()

vi.mock('electron', () => ({
  protocol: {
    handle: (scheme: string, handler: ProtocolHandler) => {
      handlers.set(scheme, handler)
    },
    registerSchemesAsPrivileged: (schemes: unknown) => registerSchemesAsPrivilegedMock(schemes)
  },
  net: {
    fetch: (url: string) => fetchMock(url)
  }
}))

import {
  registerAttachmentProtocolHandler,
  registerAttachmentProtocolSchemes
} from '@main/security/attachment-protocol'
import type { AttachmentService } from '@main/services/attachment.service'
import { VaultPathEscapeError } from '@main/services/path-guard'

describe('attachment-protocol', () => {
  beforeEach(() => {
    handlers.clear()
    fetchMock.mockReset()
    registerSchemesAsPrivilegedMock.mockReset()
  })

  it('registerSchemesAsPrivileged configures secure + standard + fetch privileges', () => {
    registerAttachmentProtocolSchemes()
    expect(registerSchemesAsPrivilegedMock).toHaveBeenCalledWith([
      expect.objectContaining({
        scheme: 'yana-attachment',
        privileges: expect.objectContaining({
          standard: true,
          secure: true,
          supportFetchAPI: true,
          stream: true,
          bypassCSP: false,
          corsEnabled: false
        })
      })
    ])
  })

  function makeService(overrides?: Partial<AttachmentService>): AttachmentService {
    return {
      saveAttachment: vi.fn(),
      resolveToAbsolutePath: vi.fn(() => '/vault/attachments/ok.png'),
      ...overrides
    }
  }

  it('serves valid paths by resolving through attachment service + net.fetch', async () => {
    const svc = makeService()
    fetchMock.mockResolvedValueOnce(new Response('bytes', { status: 200 }))
    registerAttachmentProtocolHandler(svc)

    const handler = handlers.get('yana-attachment')!
    const response = await handler({ url: 'yana-attachment://local/attachments/2026/04/ok.png' })

    expect(svc.resolveToAbsolutePath).toHaveBeenCalledWith('attachments/2026/04/ok.png')
    expect(fetchMock).toHaveBeenCalledWith('file:///vault/attachments/ok.png')
    expect(response.status).toBe(200)
  })

  it('rejects traversal attempts with 404 (no fetch issued)', async () => {
    const svc = makeService({
      resolveToAbsolutePath: vi.fn(() => {
        throw new VaultPathEscapeError()
      })
    })
    registerAttachmentProtocolHandler(svc)

    const handler = handlers.get('yana-attachment')!
    const response = await handler({ url: 'yana-attachment://local/../secret' })

    expect(response.status).toBe(404)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects unknown hosts with 404', async () => {
    const svc = makeService()
    registerAttachmentProtocolHandler(svc)
    const handler = handlers.get('yana-attachment')!

    const response = await handler({ url: 'yana-attachment://evil/attachments/ok.png' })

    expect(response.status).toBe(404)
    expect(svc.resolveToAbsolutePath).not.toHaveBeenCalled()
  })

  it('rejects empty paths with 404', async () => {
    const svc = makeService()
    registerAttachmentProtocolHandler(svc)
    const handler = handlers.get('yana-attachment')!

    const response = await handler({ url: 'yana-attachment://local/' })
    expect(response.status).toBe(404)
  })

  it('rejects paths with spaces (schema rejection before service)', async () => {
    const svc = makeService()
    registerAttachmentProtocolHandler(svc)
    const handler = handlers.get('yana-attachment')!

    const response = await handler({
      url: 'yana-attachment://local/attachments/my%20file.png'
    })

    expect(response.status).toBe(404)
    expect(svc.resolveToAbsolutePath).not.toHaveBeenCalled()
  })
})
