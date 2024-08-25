import ky from 'ky'

import { storageService } from '../services/storageService'
import { componentsToU } from '../utils/componentsToU'
import { componentsToV } from '../utils/componentsToV'
import { dateFromParts } from '../utils/dateFromParts'
import { generateFlowFieldImage } from '../utils/generateFlowFieldImage'
import { generateSchedule } from '../utils/generateSchedule'
import { isDefined } from '../utils/isDefined'
import { parse } from '../utils/parse'
import { zip } from '../utils/zip'
import { jobInfoSchema } from '../validators'

const wavesDirectionKey = 'dirpwsfc'
const wavesHeightKey = 'htsgwsfc'

const getLatestJob = async () => {
  const json = await storageService.getJson('waves/info.json')
  return json === null ? null : jobInfoSchema.parse(json).modelRunDate
}

const getLatestRun = async () => {
  const dateStrsHtml = await ky('https://nomads.ncep.noaa.gov/dods/wave/gfswave/').text()
  const dateStrs = [...new Set([...dateStrsHtml.matchAll(/gfs(\d{8})\/:/g)].map((i) => i[1]).filter(isDefined).reverse())] // prettier-ignore
  for (const dateStr of dateStrs) {
    const hourStrsHtml = await ky(`https://nomads.ncep.noaa.gov/dods/wave/gfswave/${dateStr}`).text()
    const hourStr = [...new Set([...hourStrsHtml.matchAll(/gfs_0p25_(\d{2})z(?!_anl)/g)].map((i) => i[1]).filter(isDefined).reverse())][0] // prettier-ignore
    if (hourStr) return { dateStr, hourStr }
  }
  throw new Error('No valid hours found for any date.')
}

const getUrl = (dateStr: string, hourStr: string, timeIndex: number) => {
  const variables = [wavesDirectionKey, wavesHeightKey]
  const timeRange = [timeIndex, timeIndex]
  const lngRange = [0, 4, 1439]
  const latRange = [0, 4, 720]
  const url = new URL(`https://nomads.ncep.noaa.gov/dods/wave/gfswave/${dateStr}/gfswave.global.0p25_${hourStr}z.ascii`)
  url.search = '?' + variables.map((variable) => `${variable}[${timeRange.join(':')}][${latRange.join(':')}][${lngRange.join(':')}]`).join(',')
  return url.toString()
}

export const run = async () => {
  const { dateStr, hourStr } = await getLatestRun()
  const latestRunDate = dateFromParts(dateStr, hourStr)
  const latestJobDate = await getLatestJob()
  if (latestJobDate === latestRunDate.toISOString()) return console.log('Waves tiles up to date.')
  const schedule = generateSchedule(latestRunDate, 8)
  for (const [timeIndex, date] of schedule) {
    const url = getUrl(dateStr, hourStr, timeIndex)
    const data = await ky(url).text()
    const wavesDirectionHeightTuples = zip(parse(data, wavesDirectionKey), parse(data, wavesHeightKey))
    const wavesU = wavesDirectionHeightTuples.map(([degrees, magnitude]) => componentsToU(degrees, magnitude))
    const wavesV = wavesDirectionHeightTuples.map(([degrees, magnitude]) => componentsToV(degrees, magnitude))
    const buffer = await generateFlowFieldImage({
      uValues: wavesU,
      vValues: wavesV,
      width: 360,
      height: 180,
      minMagnitude: 15,
      maxMagnitude: 15,
      xOffset: 180,
    })
    await storageService.uploadImage(buffer, 'waves', `${date.toISOString()}.png`)
  }
  const jobInfo = JSON.stringify({ modelRunDate: latestRunDate })
  await storageService.putJson('waves/jobInfo.json', jobInfo)
  console.log('Waves tiles updated.')
}
