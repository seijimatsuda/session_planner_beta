import { z } from 'zod'

export const drillSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  video_url: z.string().url('Must be a valid URL'),
  category: z.enum(['activation', 'dribbling', 'passing', 'shooting']),
  num_players: z
    .union([z.number().int().positive().max(50), z.null()])
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  equipment: z.array(z.string().min(1)).default([]),
  tags: z.array(z.string().min(1)).default([]),
})

export type DrillFormData = z.infer<typeof drillSchema>

