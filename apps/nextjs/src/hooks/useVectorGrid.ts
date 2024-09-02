import type { z } from 'zod'
import { useCallback, useMemo } from 'react'
import { scaleLinear } from 'd3-scale'

import type { VectorGridConfig, VectorGridId } from '@sctv/shared'
import { scaleLngLat, vectorGridConfigs } from '@sctv/shared'

import type { vectorGridMetadataSchema } from './useVectorGridData'
import { getPointFromImageData } from '~/utils/getPointFromImageData'
import { useVectorGridData } from './useVectorGridData'

export interface VectorGrid {
  image: ImageData
  metadata: z.infer<typeof vectorGridMetadataSchema>
  config: VectorGridConfig
}

interface UseVectorGridProps {
  vectorGridId: VectorGridId
  date: Date | null
}

export const useVectorGrid = ({ vectorGridId, date }: UseVectorGridProps) => {
  const config = useMemo(() => vectorGridConfigs[vectorGridId], [vectorGridId])
  const { vectorGrid } = useVectorGridData({ date, config })

  const queryVectorGrid = useCallback(
    (lngLat: [number, number] | null) => {
      if (!lngLat || !vectorGrid) return null
      const adjustedWidth = vectorGrid.image.width - 1 // subtract 1 from width fix (why? needs investigating)
      const adjustedHeight = vectorGrid.image.height - 1 // subtract 1 from width fix (why? needs investigating)
      let [x, y] = scaleLngLat(lngLat, [0, adjustedWidth], [0, adjustedHeight])
      x = (x + adjustedWidth / 2) % adjustedWidth // offset x by 50%
      y = adjustedHeight - y // invert y axis
      const [r, g] = getPointFromImageData.bicubic(vectorGrid.image, x, y)
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
