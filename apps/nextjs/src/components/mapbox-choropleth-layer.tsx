'use client'

import { useEffect, useRef } from 'react'

import { useMapbox } from '~/hooks/useMapbox'
import { ChoroplethRenderer } from '~/utils/choroplethRenderer'

interface MapboxChoroplethLayerProps {
  imageData: ImageData | null
}

export const MapboxChoroplethLayer = ({ imageData }: MapboxChoroplethLayerProps) => {
  const map = useMapbox()
  const choroplethRenderer = useRef<ChoroplethRenderer | null>(null)

  useEffect(() => {
    if (!imageData) return
    if (!choroplethRenderer.current) {
      map.addLayer(
        {
          id: 'choropleth-renderer',
          type: 'custom',
          onAdd: (map, gl) => {
            choroplethRenderer.current = new ChoroplethRenderer(map, gl)
            choroplethRenderer.current.updateMapBounds()
            choroplethRenderer.current.setFlowField(imageData)
          },
          render: () => choroplethRenderer.current?.draw(),
        },
        'settlement-subdivision-label',
      )
      map.on('move', () => choroplethRenderer.current?.updateMapBounds())
    } else {
      choroplethRenderer.current.setFlowField(imageData)
    }
  }, [imageData, map])
  return null
}
