import baseConfig from '@sctv/eslint-config/base'
import reactConfig from '@sctv/eslint-config/react'

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [],
  },
  ...baseConfig,
  ...reactConfig,
]
