import { z } from 'zod'

export const SearchQuerySchema = z.object({
  term: z.string().min(1, 'Search term is required'),
  limit: z.number().int().min(1).max(100).optional(),
  tags: z.array(z.string()).optional()
})
