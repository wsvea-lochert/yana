import type { ZodType } from 'zod'

export class IpcValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IpcValidationError'
  }
}

/**
 * Validate an IPC payload against a zod schema at the handler boundary.
 * Throws IpcValidationError with a generic message (no raw input leaked).
 */
export function validateIpcInput<T>(schema: ZodType<T>, input: unknown, channel: string): T {
  const result = schema.safeParse(input)
  if (!result.success) {
    const issue = result.error.issues[0]
    throw new IpcValidationError(
      `Invalid input for ${channel}: ${issue?.message ?? 'validation failed'}`
    )
  }
  return result.data
}
