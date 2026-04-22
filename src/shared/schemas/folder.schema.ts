import { z } from 'zod'

export const FolderIdSchema = z
  .string()
  .min(1, 'Folder ID is required')
  .max(128, 'Folder ID too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid folder ID format')

export const CreateFolderInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Folder name is required')
    .max(100, 'Folder name must be 100 characters or fewer')
})

export const RenameFolderInputSchema = z.object({
  id: FolderIdSchema,
  name: z
    .string()
    .min(1, 'Folder name is required')
    .max(100, 'Folder name must be 100 characters or fewer')
})
