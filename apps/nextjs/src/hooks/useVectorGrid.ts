import { useCallback } from 'react'

import type { VectorGrid } from '@sctv/shared'
import { scaleLngLat } from '@sctv/shared'

import { getPointFromImageData } from '~/utils/getPointFromImageData'
import { useImageData } from './useImageData'

export const useVectorGrid = (url: string | null, vectorGrid: VectorGrid) => {
  const { imageData: vectorGridData } = useImageData(url)

  const queryVectorGrid = useCallback(
    (lngLat: [number, number] | null) => {
      if (!lngLat) return null
      if (!vectorGridData) return null
      let [x, y] = scaleLngLat(lngLat, [0, vectorGridData.width], [0, vectorGridData.height - 1]) // subtract 1 from height fix
      x = (x + vectorGridData.width / 2) % vectorGridData.width // offset x by 50%
      y = vectorGridData.height - 1 - y // invert y axis
      const rgba = getPointFromImageData.bilinear(vectorGridData, x, y)
      return vectorGrid.decode(rgba)
    },
    [vectorGrid, vectorGridData],
  )

  return { vectorGridData, queryVectorGrid }
}
