import { createGribUrl } from '../utils/createGribUrl'
import { getLatestModelRun } from '../utils/getLatestModelRun'

export const processWind = async () => {
  const { modelRunDate, modelRunHour } = await getLatestModelRun()
  const url = createGribUrl({
    modelRunDate,
    modelRunHour,
    timeIndex: 1,
    variable: 'UGRD',
    level: '10_m_above_ground',
  })
  return url
}
