/* eslint-disable no-restricted-properties */
import { createEnv } from '@t3-oss/env-nextjs'
import { vercel } from '@t3-oss/env-nextjs/presets'
import { z } from 'zod'

export const env = createEnv({
  extends: [vercel()],
  shared: {
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },
  server: {},
  client: {
    NEXT_PUBLIC_MAPBOX_API_KEY: z.string(),
    NEXT_PUBLIC_REFERENCE_DATE: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
    NEXT_PUBLIC_CLOUDFLARE_BUCKET_URL: z.string().url(),
  },
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_MAPBOX_API_KEY: process.env.NEXT_PUBLIC_MAPBOX_API_KEY,
    NEXT_PUBLIC_REFERENCE_DATE: process.env.NEXT_PUBLIC_REFERENCE_DATE,
    NEXT_PUBLIC_CLOUDFLARE_BUCKET_URL: process.env.NEXT_PUBLIC_CLOUDFLARE_BUCKET_URL,
  },
  skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === 'lint',
})
