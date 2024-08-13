import baseConfig, { restrictEnvAccess } from '@sctv/eslint-config/base'
import nextjsConfig from '@sctv/eslint-config/nextjs'
import reactConfig from '@sctv/eslint-config/react'

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ['.next/**'],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
]
