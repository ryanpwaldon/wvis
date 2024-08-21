import ky from 'ky'

import type { ModelRunDate } from '../validators'
import { modelRunDateSchema, modelRunHourSchema } from '../validators'

const BASE_URL = 'https://nomads.ncep.noaa.gov/pub/data/nccf/com/gfs/prod'

const getLatestModelRunDate = async () => {
  try {
    const html = await ky.get(BASE_URL).text()
    const regex = /gfs\.(\d{8})\//g
    let latestDate: string | null = null
    let match: RegExpExecArray | null
    while ((match = regex.exec(html)) !== null) latestDate = match[1] ?? null
    if (!latestDate) throw new Error('No model run date found.')
    return modelRunDateSchema.parse(latestDate)
  } catch (error) {
    throw new Error(`Failed to fetch the data: ${(error as Error).message}`)
  }
}

const getLatestModelRunHour = async (modelRunDate: ModelRunDate) => {
  try {
    const html: string = await ky.get(`${BASE_URL}/gfs.${modelRunDate}/`).text()
    const regex = /(\d{2})\//g
    let latestHour: string | null = null
    let match: RegExpExecArray | null
    while ((match = regex.exec(html)) !== null) latestHour = match[1] ?? null
    if (!latestHour) throw new Error('No model run hour found.')
    return modelRunHourSchema.parse(latestHour)
  } catch (error) {
    throw new Error(`Failed to fetch the data: ${(error as Error).message}`)
  }
}

export const getLatestModelRun = async () => {
  const latestModelRunDate = await getLatestModelRunDate()
  const latestModelRunHour = await getLatestModelRunHour(latestModelRunDate)
  return { latestModelRunDate, latestModelRunHour }
}
