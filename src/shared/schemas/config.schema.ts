import { z } from 'zod'

export const AcceleratorSchema = z
  .string()
  .min(3)
  .max(64)
  .regex(/^[\x20-\x7E]+$/, 'Accelerator must be ASCII only')
  .refine((s) => s.includes('+'), 'Accelerator must combine a modifier and key')

export const AppConfigSchema = z.object({
  vaultPath: z.string().min(1),
  theme: z.enum(['light', 'dark']),
  hotkey: z.string().min(1),
  newNoteHotkey: z.string().min(1),
  fontSize: z.number().int().min(10).max(24).optional(),
  sidebarVisible: z.boolean().optional()
})

export type AppConfig = z.infer<typeof AppConfigSchema>

/**
 * Whitelist of config keys the renderer is allowed to read/write and the
 * schema each value must match.
 */
export const ConfigValueSchemas = {
  theme: z.enum(['light', 'dark']),
  overlayHotkey: AcceleratorSchema,
  newNoteHotkey: AcceleratorSchema,
  fontSize: z.number().int().min(10).max(24),
  sidebarVisible: z.boolean(),
  activeNoteId: z.string().min(1).max(128),
  focusMode: z.boolean()
} as const

export const ConfigKeyEnum = z.enum(
  Object.keys(ConfigValueSchemas) as [keyof typeof ConfigValueSchemas]
)

export type ConfigKey = z.infer<typeof ConfigKeyEnum>
