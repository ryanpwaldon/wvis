import { CLOUDFLARE_BUCKET_URL } from '../constants'

export const vectorGridConfigs = {
  wind: {
    id: 'wind',
    title: 'Wind',
    url(date: Date) {
      return `${CLOUDFLARE_BUCKET_URL}/${this.id}/${date.toISOString()}.png`
    },
    colorRampMaxMag: 25,
  },
  waves: {
    id: 'waves',
    title: 'Waves',
    url(date: Date) {
      return `${CLOUDFLARE_BUCKET_URL}/${this.id}/${date.toISOString()}.png`
    },
    colorRampMaxMag: 10,
  },
} as const

export type VectorGridConfig = (typeof vectorGridConfigs)[keyof typeof vectorGridConfigs]
export type VectorGridId = (typeof vectorGridConfigs)[keyof typeof vectorGridConfigs]['id']
