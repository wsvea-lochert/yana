import { z } from 'zod'

export const AppConfigSchema = z.object({
  vaultPath: z.string().min(1),
  theme: z.enum(['light', 'dark']),
  hotkey: z.string().min(1),
  newNoteHotkey: z.string().min(1),
  fontSize: z.number().int().min(10).max(24).optional(),
  sidebarVisible: z.boolean().optional()
})

export type AppConfig = z.infer<typeof AppConfigSchema>
