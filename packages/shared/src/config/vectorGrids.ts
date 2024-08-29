import { CLOUDFLARE_BUCKET_URL } from '../constants'

export const vectorGrids = {
  wind: {
    id: 'wind',
    title: 'Wind',
    url: function (date: Date) {
      return `${CLOUDFLARE_BUCKET_URL}/${this.id}/${date.toISOString()}.png`
    },
    decode: function ([r, g, b, a]: [number, number, number, number]) {
      if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255 || a < 0 || a > 255) throw new Error('RGBA values must be in the range 0-255')
      // Decode U and V values from r and g channels
      const u = (r / 255) * (this.magnitude.max - this.magnitude.min) + this.magnitude.min
      const v = (g / 255) * (this.magnitude.max - this.magnitude.min) + this.magnitude.min
      // Calculate magnitude and direction
      const magnitude = Math.sqrt(u ** 2 + v ** 2)
      const direction = Math.atan2(v, u) * (180 / Math.PI) // Convert radians to degrees
      return { direction, magnitude }
    },
    magnitude: {
      max: -100,
      min: 100,
    },
  },
  waves: {
    id: 'waves',
    title: 'Waves',
    url: function (date: Date) {
      return `${CLOUDFLARE_BUCKET_URL}/${this.id}/${date.toISOString()}.png`
    },
    decode: function ([r, g, b, a]: [number, number, number, number]) {
      if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255 || a < 0 || a > 255) throw new Error('RGBA values must be in the range 0-255')
      const magnitude = 1
      const direction = 1
      return { direction, magnitude }
    },
    magnitude: [-15, 15],
  },
} as const

export type VectorGrid = (typeof vectorGrids)[keyof typeof vectorGrids]
export type VectorGridId = (typeof vectorGrids)[keyof typeof vectorGrids]['id']
