import { protocol, net } from 'electron'
import { pathToFileURL } from 'url'
import { ATTACHMENT_HOST, ATTACHMENT_PROTOCOL } from '@shared/constants/defaults'
import { AttachmentResolveInputSchema } from '@shared/schemas/attachment.schema'
import type { AttachmentService } from '../services/attachment.service'
import { createLogger } from '@shared/logger'

const logger = createLogger('attachment-protocol')

/**
 * Must run BEFORE `app.whenReady()` so Electron treats the scheme as standard
 * + secure. Privileges kept intentionally narrow — no serviceWorkers, no CORS
 * allow-all.
 */
export function registerAttachmentProtocolSchemes(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: ATTACHMENT_PROTOCOL,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        stream: true,
        bypassCSP: false,
        corsEnabled: false
      }
    }
  ])
}

/**
 * Register the actual request handler. Must run AFTER `app.whenReady()`.
 * Every request goes through `ensureInsideVault` in the service layer so we
 * cannot be tricked into serving files outside the vault via encoded paths.
 */
export function registerAttachmentProtocolHandler(
  attachmentService: AttachmentService
): void {
  protocol.handle(ATTACHMENT_PROTOCOL, async (request) => {
    try {
      const url = new URL(request.url)
      // Strict equality — empty host must NOT short-circuit past the check.
      if (url.host !== ATTACHMENT_HOST) {
        return new Response('Not Found', { status: 404 })
      }
      const rel = decodeURIComponent(url.pathname.replace(/^\/+/, ''))
      // Re-validate shape with the shared schema so encoded traversal,
      // spaces, UNC-style paths, null bytes, and illegal characters are
      // rejected before the service resolves to disk.
      const safeRel = AttachmentResolveInputSchema.parse(rel)
      const absolute = attachmentService.resolveToAbsolutePath(safeRel)
      return await net.fetch(pathToFileURL(absolute).toString())
    } catch (error) {
      logger.warn('attachment protocol request rejected', error)
      return new Response('Not Found', { status: 404 })
    }
  })
}
