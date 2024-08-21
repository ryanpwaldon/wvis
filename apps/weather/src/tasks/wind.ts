import type { Message } from 'grib-ts/dist/message'
import { GribReader, readMessageData } from 'grib-ts'
import ky from 'ky'

import type { JobInfo, ModelForecastHour, ModelRunDate, ModelRunHour } from '../validators'
import { storageService } from '../services/storageService'
import { createDateFromComponents } from '../utils/dateFromComponents'
import { generateFlowFieldImage } from '../utils/generateFlowFieldImage'
import { generateForecastSchedule } from '../utils/generateForecastSchedule'
import { generateGribUrl } from '../utils/generateGribUrl'
import { getLatestModelRun } from '../utils/getLatestModelRun'

export const processWind = async () => {
  console.log('Starting wind processing job...')
  const latestJobInfo = await storageService.getLatestJobInfo('wind')
  const { latestModelRunDate, latestModelRunHour } = await getLatestModelRun()
  console.log(`Latest model run: Date = ${latestModelRunDate}, Hour = ${latestModelRunHour}`)
  if (latestJobInfo?.modelRunDate === latestModelRunDate && latestJobInfo.modelRunHour === latestModelRunHour) {
    return console.log('Job skipped. Wind tiles up to date.')
  }
  const modelRunDate = createDateFromComponents(latestModelRunDate, latestModelRunHour)
  const forecastSchedule = generateForecastSchedule(modelRunDate, '3h', 7)
  console.log('Generated forecast schedule:', forecastSchedule)
  for (const forecastInfo of forecastSchedule) {
    console.log(`Processing image for forecast hour: ${forecastInfo.hourString} on ${forecastInfo.dateString}`)
    await processImage(latestModelRunDate, latestModelRunHour, forecastInfo.hourString, forecastInfo.dateString)
  }
  const newJobInfo: JobInfo = { modelRunDate: latestModelRunDate, modelRunHour: latestModelRunHour }
  console.log('Updating job info...')
  await storageService.updateJobInfo('wind', newJobInfo)
  console.log('Job info updated. Wind processing job completed.')
}

export const processImage = async (
  modelRunDate: ModelRunDate,
  modelRunHour: ModelRunHour,
  modelForecastHour: ModelForecastHour,
  modelForecastHourDate: string,
) => {
  console.log(`Generating GRIB URL for forecast hour ${modelForecastHour}...`)
  const url = generateGribUrl({ modelRunDate, modelRunHour, modelForecastHour, variables: new Set(['UGRD', 'VGRD']), level: '10_m_above_ground' })
  console.log('Fetching GRIB data from URL:', url)
  const response = await ky.get(url)
  const buffer = await response.arrayBuffer()
  console.log('Parsing GRIB data...')
  const gribReader = new GribReader(buffer)
  const rawU = readMessageData(gribReader.messages().next().value as Message)
  const rawV = readMessageData(gribReader.messages().next().value as Message)
  console.log('Generating flow field image...')
  const imageBuffer = await generateFlowFieldImage(rawU, rawV, 360, 181, 180)
  console.log(`Uploading image for forecast hour ${modelForecastHour}...`)
  await storageService.uploadImage(imageBuffer, 'wind', `${modelForecastHourDate}.png`)
  console.log(`Image for ${modelForecastHourDate}.png uploaded successfully.`)
}
