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
  const dateStrs = [...new Set([...dateStrsHtml.matchAll(/<b>\d+: (\d{8})\/:<\/b>/g)].map((i) => i[1]).filter(isDefined).reverse())] // prettier-ignore
  for (const dateStr of dateStrs) {
    const hourStrsHtml = await ky(`https://nomads.ncep.noaa.gov/dods/wave/gfswave/${dateStr}`).text()
    const hourStr = [...new Set([...hourStrsHtml.matchAll(/gfswave.global.0p25_(\d{2})z/g)].map((i) => i[1]).filter(isDefined).reverse())][0] // prettier-ignore
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
  console.log('Starting waves tiles update...')
  console.log('Fetching latest run date...')
  const { dateStr, hourStr } = await getLatestRun()
  const latestRunDate = dateFromParts(dateStr, hourStr)
  console.log('Latest run date:', dateStr, hourStr, latestRunDate)
  console.log('Fetching latest job date...')
  const latestJobDate = await getLatestJob()
  console.log('Latest job date:', latestJobDate)
  if (latestJobDate === latestRunDate.toISOString()) return console.log('Waves tiles up to date.')
  const schedule = generateSchedule(latestRunDate, 2)
  console.log('Generated schedule:', schedule)
  for (const [timeIndex, date] of schedule) {
    console.log(`Processing time index: ${timeIndex}, date: ${date.toISOString()}`)
    const url = getUrl(dateStr, hourStr, timeIndex)
    console.log(`Generated URL for time index: ${timeIndex}`, url)
    const data = await ky(url).text()
    console.log('Data fetched time index:', timeIndex)
    const wavesDirectionHeightTuples = zip(parse(data, wavesDirectionKey).values, parse(data, wavesHeightKey).values)
    console.log('Parsed waves direction and height data for time index:', timeIndex)
    let minU = Infinity
    let maxU = -Infinity
    let minV = Infinity
    let maxV = -Infinity
    const wavesU: number[] = []
    const wavesV: number[] = []
    wavesDirectionHeightTuples.forEach(([direction, height]) => {
      const u = componentsToU(direction, height)
      const v = componentsToV(direction, height)
      wavesU.push(u)
      wavesV.push(v)
      if (u < minU) minU = u
      if (u > maxU) maxU = u
      if (v < minV) minV = v
      if (v > maxV) maxV = v
    })
    console.log(`Computed U and V components time index ${timeIndex}`)
    const buffer = await generateFlowFieldImage({
      u: wavesU,
      v: wavesV,
      minU,
      maxU,
      minV,
      maxV,
      width: 360,
      height: 181,
    })
    console.log('Image buffer generated time index:', timeIndex)
    await storageService.uploadImage(buffer, 'waves', `${date.toISOString()}.png`)
    console.log('Image uploaded date:', date)
  }
  const jobInfo = JSON.stringify({ modelRunDate: latestRunDate })
  await storageService.putJson('waves/jobInfo.json', jobInfo)
  console.log('Job info updated with latest run date.')
  console.log('Waves tiles updated.')
}
