import ky from 'ky'

import { storageService } from '../services/storageService'
import { dateFromParts } from '../utils/dateFromParts'
import { generateFlowFieldImage } from '../utils/generateFlowFieldImage'
import { generateSchedule } from '../utils/generateSchedule'
import { isDefined } from '../utils/isDefined'
import { parse } from '../utils/parse'
import { jobInfoSchema } from '../validators'

const windUKey = 'ugrd10m'
const windVKey = 'vgrd10m'

const getLatestJob = async () => {
  const json = await storageService.getJson('wind/info.json')
  return json === null ? null : jobInfoSchema.parse(json).modelRunDate
}

const getLatestRun = async () => {
  const dateStrsHtml = await ky('https://nomads.ncep.noaa.gov/dods/gfs_0p25/').text()
  const dateStrs = [...new Set([...dateStrsHtml.matchAll(/gfs(\d{8})\/:/g)].map((i) => i[1]).filter(isDefined).reverse())] // prettier-ignore
  for (const dateStr of dateStrs) {
    const hourStrsHtml = await ky(`https://nomads.ncep.noaa.gov/dods/gfs_0p25/gfs${dateStr}`).text()
    const hourStr = [...new Set([...hourStrsHtml.matchAll(/gfs_0p25_(\d{2})z(?!_anl)/g)].map((i) => i[1]).filter(isDefined).reverse())][0] // prettier-ignore
    if (hourStr) return { dateStr, hourStr }
  }
  throw new Error('No valid hours found for any date.')
}

const getUrl = (dateStr: string, hourStr: string, timeIndex: number) => {
  const variables = [windUKey, windVKey]
  const timeRange = [timeIndex, timeIndex]
  const lngRange = [0, 4, 1439]
  const latRange = [0, 4, 720]
  const url = new URL(`https://nomads.ncep.noaa.gov/dods/gfs_0p25/gfs${dateStr}/gfs_0p25_${hourStr}z.ascii`)
  url.search = '?' + variables.map((variable) => `${variable}[${timeRange.join(':')}][${latRange.join(':')}][${lngRange.join(':')}]`).join(',')
  return url.toString()
}

export const run = async () => {
  console.log('Starting wind tiles update...')
  console.log('Fetching latest run date...')
  const { dateStr, hourStr } = await getLatestRun()
  const latestRunDate = dateFromParts(dateStr, hourStr)
  console.log('Latest run date:', dateStr, hourStr, latestRunDate)
  console.log('Fetching latest job date...')
  const latestJobDate = await getLatestJob()
  console.log('Latest job date:', latestJobDate)
  if (latestJobDate === latestRunDate.toISOString()) return console.log('Wind tiles up to date.')
  const schedule = generateSchedule(latestRunDate, 8)
  console.log('Generated schedule:', schedule)
  for (const [timeIndex, date] of schedule) {
    console.log(`Processing time index: ${timeIndex}, date: ${date.toISOString()}`)
    const url = getUrl(dateStr, hourStr, timeIndex)
    console.log(`Generated URL for time index: ${timeIndex}`, url)
    const data = await ky(url).text()
    console.log('Data fetched for time index:', timeIndex)
    const windU = parse(data, windUKey)
    const windV = parse(data, windVKey)
    const buffer = await generateFlowFieldImage({
      uValues: windU,
      vValues: windV,
      width: 360,
      height: 181,
      minMagnitude: -100,
      maxMagnitude: 100,
      xOffset: 180,
    })
    console.log('Image buffer generated for time index:', timeIndex)
    await storageService.uploadImage(buffer, 'wind', `${date.toISOString()}.png`)
    console.log('Image uploaded for date:', date)
  }
  const jobInfo = JSON.stringify({ modelRunDate: latestRunDate })
  await storageService.putJson('wind/jobInfo.json', jobInfo)
  console.log('Job info updated with latest run date.')
  console.log('Wind tiles updated.')
}
