import { z } from 'zod'

export const CreateFolderInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Folder name is required')
    .max(100, 'Folder name must be 100 characters or fewer')
})

export const RenameFolderInputSchema = z.object({
  id: z.string().min(1, 'Folder ID is required'),
  name: z
    .string()
    .min(1, 'Folder name is required')
    .max(100, 'Folder name must be 100 characters or fewer')
})
