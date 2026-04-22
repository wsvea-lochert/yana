import { z } from 'zod'

export const NoteIdSchema = z
  .string()
  .min(1, 'Note ID is required')
  .max(128, 'Note ID too long')
  .regex(/^[a-z0-9][a-z0-9-]*$/, 'Invalid note ID format')

export const FrontmatterSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  created: z.string().optional(),
  modified: z.string().optional(),
  tags: z.array(z.string().min(1).max(50)).optional(),
  aliases: z.array(z.string().min(1).max(100)).optional(),
  folder: z.string().max(100).optional()
})

export const CreateNoteInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or fewer'),
  content: z.string().optional(),
  tags: z.array(z.string().min(1).max(50)).optional(),
  folder: z.string().max(100).optional()
})

export const UpdateNoteInputSchema = z.object({
  id: z.string().min(1, 'Note ID is required'),
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(255, 'Title must be 255 characters or fewer')
    .optional(),
  content: z.string().optional(),
  tags: z.array(z.string().min(1).max(50)).optional(),
  folder: z.string().max(100).optional()
})
