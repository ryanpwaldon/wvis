import { z } from 'zod'

export const modelRunDateSchema = z.string().regex(/^\d{8}$/)
export type ModelRunDate = z.infer<typeof modelRunDateSchema>

export const modelRunHourSchema = z.enum(['00', '06', '12', '18'])
export type ModelRunHour = z.infer<typeof modelRunHourSchema>
