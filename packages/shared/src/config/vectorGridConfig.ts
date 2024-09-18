import { CLOUDFLARE_BUCKET_URL } from '../constants'

export enum ChoroplethCombinationMode {
  Cancellation,
  Preservation,
}

export const vectorGridConfigs = {
  wind: {
    id: 'wind',
    title: 'Wind',
    url(date: Date) {
      return `${CLOUDFLARE_BUCKET_URL}/${this.id}/${date.toISOString()}.png`
    },
    magMax: 25,
    units: {
      base: 'mps',
      options: [
        { display: 'MPS', value: 'mps' },
        { display: 'MPH', value: 'mph' },
        { display: 'KPH', value: 'kph' },
        { display: 'KTS', value: 'kts' },
      ],
    },
    choropleth: {
      combinationMode: ChoroplethCombinationMode.Cancellation,
    },
  },
  waves: {
    id: 'waves',
    title: 'Waves',
    url(date: Date) {
      return `${CLOUDFLARE_BUCKET_URL}/${this.id}/${date.toISOString()}.png`
    },
    magMax: 8,
    units: {
      base: 'm',
      options: [
        { display: 'M', value: 'm' },
        { display: 'FT', value: 'ft' },
      ],
    },
    choropleth: {
      combinationMode: ChoroplethCombinationMode.Preservation,
    },
  },
} as const

export type VectorGridConfig = (typeof vectorGridConfigs)[keyof typeof vectorGridConfigs]
export type VectorGridId = (typeof vectorGridConfigs)[keyof typeof vectorGridConfigs]['id']
