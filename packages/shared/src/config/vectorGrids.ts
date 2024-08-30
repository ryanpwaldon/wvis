import { CLOUDFLARE_BUCKET_URL } from '../constants'

export const vectorGrids = {
  wind: {
    id: 'wind',
    title: 'Wind',
    url(date: Date) {
      return `${CLOUDFLARE_BUCKET_URL}/${this.id}/${date.toISOString()}.png`
    },
    decode([r, g, b, a]: [number, number, number, number]) {
      if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255 || a < 0 || a > 255) throw new Error('RGBA values must be in the range 0-255')
      // Decode U and V values from r and g channels
      const u = (r / 255) * (this.magnitude.max - this.magnitude.min) + this.magnitude.min
      const v = (g / 255) * (this.magnitude.max - this.magnitude.min) + this.magnitude.min
      // Calculate magnitude and direction
      const magnitude = Math.sqrt(u ** 2 + v ** 2)
      // Correct the direction to meteorological convention (0° is north)
      let direction = Math.atan2(-u, -v) * (180 / Math.PI) // Reverse u and v
      direction = (direction + 360) % 360 // Normalize to [0, 360)
      return { direction, magnitude }
    },
    magnitude: {
      min: -100,
      max: 100,
    },
  },
  waves: {
    id: 'waves',
    title: 'Waves',
    url(date: Date) {
      return `${CLOUDFLARE_BUCKET_URL}/${this.id}/${date.toISOString()}.png`
    },
    decode([r, g, b, a]: [number, number, number, number]) {
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
