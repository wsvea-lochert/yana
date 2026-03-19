import { z } from 'zod'

export const CreateNoteInputSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be 255 characters or fewer'),
  content: z.string().optional(),
  tags: z.array(z.string().min(1).max(50)).optional()
})

export const UpdateNoteInputSchema = z.object({
  id: z.string().min(1, 'Note ID is required'),
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(255, 'Title must be 255 characters or fewer')
    .optional(),
  content: z.string().optional(),
  tags: z.array(z.string().min(1).max(50)).optional()
})
