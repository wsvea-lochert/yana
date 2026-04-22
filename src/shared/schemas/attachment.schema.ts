import { z } from 'zod'
import { MAX_ATTACHMENT_BYTES } from '@shared/constants/defaults'

/**
 * Schema for a save-attachment IPC call. Bytes arrive as Uint8Array via
 * structured clone. Filename is treated as a user-supplied hint only; the
 * service re-derives a safe basename + hash before writing.
 */
export const SaveAttachmentInputSchema = z.object({
  filename: z
    .string()
    .min(1, 'filename required')
    .max(255, 'filename too long'),
  mime: z
    .string()
    .min(1, 'mime required')
    .max(127)
    .regex(/^[\w.+-]+\/[\w.+-]+$/, 'invalid mime type'),
  bytes: z
    .instanceof(Uint8Array)
    .refine((b) => b.length > 0, 'empty file')
    .refine((b) => b.length <= MAX_ATTACHMENT_BYTES, 'file exceeds max size')
})

export type SaveAttachmentInput = z.infer<typeof SaveAttachmentInputSchema>

export const AttachmentResolveInputSchema = z
  .string()
  .min(1)
  .max(512)
  .regex(/^[A-Za-z0-9/_.\-]+$/, 'invalid attachment path')
  .refine((p) => !p.split('/').some((seg) => seg === '..' || seg === ''), 'traversal detected')

export type AttachmentResolveInput = z.infer<typeof AttachmentResolveInputSchema>
