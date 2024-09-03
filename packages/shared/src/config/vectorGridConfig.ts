import { CLOUDFLARE_BUCKET_URL } from '../constants'

const units = {
  speed: ['mps', 'kmph', 'mph', 'kts'],
  height: ['m', 'ft'],
}

export const vectorGridConfigs = {
  wind: {
    id: 'wind',
    title: 'Wind',
    url(date: Date) {
      return `${CLOUDFLARE_BUCKET_URL}/${this.id}/${date.toISOString()}.png`
    },
    magMax: 25,
    magBaseUnit: 'mps',
    magUnits: units.speed,
  },
  waves: {
    id: 'waves',
    title: 'Waves',
    url(date: Date) {
      return `${CLOUDFLARE_BUCKET_URL}/${this.id}/${date.toISOString()}.png`
    },
    magMax: 8,
    magBaseUnit: 'm',
    magUnits: units.height,
  },
} as const

export type VectorGridConfig = (typeof vectorGridConfigs)[keyof typeof vectorGridConfigs]
export type VectorGridId = (typeof vectorGridConfigs)[keyof typeof vectorGridConfigs]['id']
