import type { Message } from 'grib-ts/dist/message'
import { GribReader, readMessageData } from 'grib-ts'
import ky from 'ky'

import type { ModelForecastHour, ModelRunDate, ModelRunHour } from '../validators'
import { storageService } from '../services/storageService'
import { createDateFromComponents } from '../utils/dateFromComponents'
import { generateFlowFieldImage } from '../utils/generateFlowFieldImage'
import { generateForecastSchedule } from '../utils/generateForecastSchedule'
import { generateGribUrl } from '../utils/generateGribUrl'
import { getLatestModelRun } from '../utils/getLatestModelRun'

export const processWind = async () => {
  const latestJobInfo = await storageService.getLatestJobInfo('wind')
  const { latestModelRunDate, latestModelRunHour } = await getLatestModelRun()
  if (latestJobInfo.modelRunDate === latestModelRunDate && latestJobInfo.modelRunHour === latestModelRunHour) return console.log('Job skipped. Wind tiles up to date.') // prettier-ignore
  const modelRunDate = createDateFromComponents(latestModelRunDate, latestModelRunHour)
  const forecastSchedule = generateForecastSchedule(modelRunDate, '3h', 1)
  for (const forecastInfo of forecastSchedule) {
    await processImage(latestModelRunDate, latestModelRunHour, forecastInfo.hourString, forecastInfo.dateString)
  }
}

export const processImage = async (
  modelRunDate: ModelRunDate,
  modelRunHour: ModelRunHour,
  modelForecastHour: ModelForecastHour,
  modelForecastHourDate: string,
) => {
  const url = generateGribUrl({ modelRunDate, modelRunHour, modelForecastHour, variables: new Set(['UGRD', 'VGRD']), level: '10_m_above_ground' })
  const response = await ky.get(url)
  const buffer = await response.arrayBuffer()
  const gribReader = new GribReader(buffer)
  const rawU = readMessageData(gribReader.messages().next().value as Message)
  const rawV = readMessageData(gribReader.messages().next().value as Message)
  const imageBuffer = await generateFlowFieldImage(rawU, rawV, 360, 181, 180)
  await storageService.uploadImage(imageBuffer, 'wind', `${modelForecastHourDate}.png`)
}
