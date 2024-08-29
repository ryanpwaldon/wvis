'use client'

import { useEffect, useRef } from 'react'

import { useMapbox } from '~/hooks/useMapbox'
import { ChoroplethRenderer } from '~/utils/choroplethRenderer'

interface MapboxChoroplethLayerProps {
  vectorGridData: ImageData | null
}

export const MapboxChoroplethLayer = ({ vectorGridData }: MapboxChoroplethLayerProps) => {
  const map = useMapbox()
  const choroplethRenderer = useRef<ChoroplethRenderer | null>(null)

  useEffect(() => {
    if (!vectorGridData) return
    if (!choroplethRenderer.current) {
      map.addLayer(
        {
          id: 'choropleth-renderer',
          type: 'custom',
          onAdd: (map, gl) => {
            choroplethRenderer.current = new ChoroplethRenderer(map, gl)
            choroplethRenderer.current.updateMapBounds()
            choroplethRenderer.current.setFlowField(vectorGridData)
          },
          render: () => choroplethRenderer.current?.draw(),
        },
        'settlement-subdivision-label',
      )
      map.on('move', () => choroplethRenderer.current?.updateMapBounds())
    } else {
      choroplethRenderer.current.setFlowField(vectorGridData)
    }
  }, [vectorGridData, map])
  return null
}
