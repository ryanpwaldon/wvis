export const CLOUDFLARE_BUCKET_NAME = 'sctv'
export const CLOUDFLARE_BUCKET_URL = 'https://pub-5dbf9b45f5d646089f0f30eea8a8a149.r2.dev'

export const WEATHER_LAYERS = {
  wind: {
    id: 'wind',
    title: 'Wind',
    imageUrlTemplate: function (date: Date) {
      return `${CLOUDFLARE_BUCKET_URL}/${this.id}/${date.toISOString()}.png`
    },
  },
  waves: {
    id: 'waves',
    title: 'Waves',
    imageUrlTemplate: function (date: Date) {
      return `${CLOUDFLARE_BUCKET_URL}/${this.id}/${date.toISOString()}.png`
    },
  },
} as const

export type WeatherLayerId = (typeof WEATHER_LAYERS)[keyof typeof WEATHER_LAYERS]['id']
