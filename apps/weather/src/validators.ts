import { z } from 'zod'

export const dateStrSchema = z.string().regex(/^\d{8}$/)
export type DateStr = z.infer<typeof dateStrSchema>

export const hourStrSchema = z.enum(['00', '06', '12', '18'])
export type HourStr = z.infer<typeof hourStrSchema>

export const jobInfoSchema = z.object({ modelRunDate: z.string().datetime() })
export type JobInfo = z.infer<typeof jobInfoSchema>
