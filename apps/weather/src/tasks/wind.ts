import type { Message } from 'grib-ts/dist/message'
import { GribReader, readMessageData } from 'grib-ts'
import ky from 'ky'

import type { ModelForecastHour, ModelRunDate, ModelRunHour } from '../validators'
import { generateFlowFieldImage } from '../utils/generateFlowFieldImage'
import { generateGribUrl } from '../utils/generateGribUrl'
import { generateModelForecastHourArray } from '../utils/generateModelForecastHourArray'
import { getLatestModelRun } from '../utils/getLatestModelRun'

export const processWind = async () => {
  const modelForecastHours = generateModelForecastHourArray('3h', 7)
  const { modelRunDate, modelRunHour } = await getLatestModelRun()
  for (const modelForecastHour of modelForecastHours) {
    await processImage(modelRunDate, modelRunHour, modelForecastHour)
  }
}

export const processImage = async (modelRunDate: ModelRunDate, modelRunHour: ModelRunHour, modelForecastHour: ModelForecastHour) => {
  const url = generateGribUrl({ modelRunDate, modelRunHour, modelForecastHour, variables: new Set(['UGRD', 'VGRD']), level: '10_m_above_ground' })
  const response = await ky.get(url)
  const buffer = await response.arrayBuffer()
  const gribReader = new GribReader(buffer)
  const rawU = readMessageData(gribReader.messages().next().value as Message)
  const rawV = readMessageData(gribReader.messages().next().value as Message)
  await generateFlowFieldImage(rawU, rawV, 360, 181, 180, './img.png')
  return null
}
