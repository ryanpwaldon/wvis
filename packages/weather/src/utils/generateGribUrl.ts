import { z } from 'zod'

import { modelForecaseHourSchema, modelRunDateSchema, modelRunHourSchema } from '../validators'

const RES = '1p00'
const BASE_URL = `https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_${RES}.pl`

const generateGribUrlSchema = z.object({
  modelRunDate: modelRunDateSchema,
  modelRunHour: modelRunHourSchema,
  variables: z.set(z.enum(['UGRD', 'VGRD'])),
  level: z.enum(['10_m_above_ground']),
  modelForecastHour: modelForecaseHourSchema,
})

type GenerateGribUrl = z.infer<typeof generateGribUrlSchema>

export const generateGribUrl = (props: GenerateGribUrl) => {
  const { modelRunDate, modelRunHour, variables, level, modelForecastHour } = generateGribUrlSchema.parse(props)
  const url = new URL(BASE_URL)
  url.pathname = `/cgi-bin/filter_gfs_${RES}.pl`
  url.searchParams.append('dir', `/gfs.${modelRunDate}/${modelRunHour}/atmos`)
  url.searchParams.append('file', `gfs.t${modelRunHour}z.pgrb2.${RES}.f${modelForecastHour}`)
  variables.forEach((variable) => url.searchParams.append(`var_${variable}`, 'on'))
  url.searchParams.append(`lev_${level}`, 'on')
  return url.toString()
}
