import { run as runWaves } from './tasks/waves'
import { run as runWind } from './tasks/wind'

const main = async () => {
  await runWind()
  await runWaves()
}

await main()
