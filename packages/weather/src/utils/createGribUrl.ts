import { z } from 'zod'

import { modelRunDateSchema, modelRunHourSchema } from '../validators'

const RES = '1p00'
const BASE_URL = `https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_${RES}.pl`

const createGribUrlSchema = z.object({
  modelRunDate: modelRunDateSchema,
  modelRunHour: modelRunHourSchema,
  variable: z.enum(['UGRD', 'VGRD']),
  level: z.enum(['10_m_above_ground']),
  timeIndex: z.number().min(0).max(128),
})

type CreateGribUrl = z.infer<typeof createGribUrlSchema>

export const createGribUrl = (props: CreateGribUrl) => {
  const { modelRunDate, modelRunHour, variable, level, timeIndex } = createGribUrlSchema.parse(props)
  const url = new URL(BASE_URL)
  url.pathname = `/cgi-bin/filter_gfs_${RES}.pl`
  url.searchParams.append('dir', `/gfs.${modelRunDate}/${modelRunHour}/atmos`)
  url.searchParams.append('file', `gfs.t${modelRunHour}z.pgrb2.${RES}.f${(timeIndex * 3).toString().padStart(3, '0')}`)
  url.searchParams.append(`var_${variable}`, 'on')
  url.searchParams.append(`lev_${level}`, 'on')
  return url.toString()
}
