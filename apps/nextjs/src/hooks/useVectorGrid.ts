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
      let [x, y] = scaleLngLat(lngLat, [0, vectorGrid.image.width], [0, vectorGrid.image.height - 1]) // subtract 1 from height fix
      x = (x + vectorGrid.image.width / 2) % vectorGrid.image.width // offset x by 50%
      y = vectorGrid.image.height - 1 - y // invert y axis
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
