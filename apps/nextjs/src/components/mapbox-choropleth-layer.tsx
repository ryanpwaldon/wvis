'use client'

import { useEffect, useRef } from 'react'

import type { VectorGrid } from '~/hooks/useVectorGrid'
import { useMapbox } from '~/hooks/useMapbox'
import { ChoroplethRenderer } from '~/utils/choroplethRenderer'

interface MapboxChoroplethLayerProps {
  vectorGrid: VectorGrid | null
}

export const MapboxChoroplethLayer = ({ vectorGrid }: MapboxChoroplethLayerProps) => {
  const map = useMapbox()
  const choroplethRenderer = useRef<ChoroplethRenderer | null>(null)

  useEffect(() => {
    if (!vectorGrid) return
    if (!choroplethRenderer.current) {
      map.addLayer(
        {
          id: 'choropleth-renderer',
          type: 'custom',
          onAdd: (map, gl) => {
            choroplethRenderer.current = new ChoroplethRenderer(map, gl)
            choroplethRenderer.current.updateMapBounds()
            choroplethRenderer.current.setVectorGrid(vectorGrid)
          },
          render: () => choroplethRenderer.current?.draw(),
        },
        'settlement-subdivision-label',
      )
      map.on('move', () => choroplethRenderer.current?.updateMapBounds())
    } else {
      choroplethRenderer.current.setVectorGrid(vectorGrid)
    }
  }, [vectorGrid, map])
  return null
}
