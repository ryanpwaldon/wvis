import { useCallback } from 'react'
import { scaleLinear } from 'd3-scale'

import { scaleLngLat } from '@sctv/shared'

import { getPointFromImageData } from '~/utils/getPointFromImageData'
import { useImageData } from './useImageData'

export const useVectorGrid = (url: string | null) => {
  const { vectorGrid } = useImageData(url)

  const queryVectorGrid = useCallback(
    (lngLat: [number, number] | null) => {
      if (!lngLat || !vectorGrid) return null
      const adjustedWidth = vectorGrid.image.width - 1 // subtract 1 from width fix (why? needs investigating)
      const adjustedHeight = vectorGrid.image.height - 1 // subtract 1 from width fix (why? needs investigating)
      let [x, y] = scaleLngLat(lngLat, [0, adjustedWidth], [0, adjustedHeight])
      x = (x + adjustedWidth / 2) % adjustedWidth // offset x by 50%
      y = adjustedHeight - y // invert y axis
      const [r, g] = getPointFromImageData.bilinear(vectorGrid.image, x, y)
      const scaleR = scaleLinear().domain([0, 255]).range([vectorGrid.metadata.minU, vectorGrid.metadata.maxU])
      const scaleG = scaleLinear().domain([0, 255]).range([vectorGrid.metadata.minV, vectorGrid.metadata.maxV])
      const u = scaleR(r)
      const v = scaleG(g)
      const magnitude = Math.sqrt(u ** 2 + v ** 2)
      let direction = Math.atan2(-u, -v) * (180 / Math.PI) // reverse u and v
      direction = (direction + 360) % 360 // normalize to [0, 360)
      return { direction, magnitude }
    },
    [vectorGrid],
  )

  return { vectorGrid, queryVectorGrid }
}
