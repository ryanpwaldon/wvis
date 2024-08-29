import { CLOUDFLARE_BUCKET_URL } from '../constants'

export const vectorGrids = {
  wind: {
    id: 'wind',
    title: 'Wind',
    url: function (date: Date) {
      return `${CLOUDFLARE_BUCKET_URL}/${this.id}/${date.toISOString()}.png`
    },
    magnitude: [-100, 100],
  },
  waves: {
    id: 'waves',
    title: 'Waves',
    url: function (date: Date) {
      return `${CLOUDFLARE_BUCKET_URL}/${this.id}/${date.toISOString()}.png`
    },
    magnitude: [-15, 15],
  },
} as const

export type VectorGridId = (typeof vectorGrids)[keyof typeof vectorGrids]['id']
