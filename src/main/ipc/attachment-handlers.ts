import { ipcMain } from 'electron'
import { CHANNELS } from '@shared/constants/channels'
import { SaveAttachmentInputSchema } from '@shared/schemas/attachment.schema'
import { validateIpcInput } from './validate'
import type { AttachmentService } from '../services/attachment.service'

export function registerAttachmentHandlers(attachmentService: AttachmentService): void {
  ipcMain.handle(CHANNELS.ATTACHMENT_SAVE, async (_event, input: unknown) => {
    const validated = validateIpcInput(
      SaveAttachmentInputSchema,
      input,
      CHANNELS.ATTACHMENT_SAVE
    )
    try {
      const saved = await attachmentService.saveAttachment(validated)
      return {
        url: saved.protocolUrl,
        relativePath: saved.relativePath,
        size: saved.size
      }
    } catch (error) {
      throw new Error(
        `Failed to save attachment: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  })
}
