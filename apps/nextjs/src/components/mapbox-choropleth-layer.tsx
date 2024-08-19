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
          id: 'particle-renderer',
          type: 'custom',
          onAdd: (map, gl) => {
            choroplethRenderer.current = new ChoroplethRenderer(map, gl)
            choroplethRenderer.current.initialize(imageData)
          },
          render: () => choroplethRenderer.current?.draw(),
        },
        'settlement-subdivision-label',
      )
      map.on('movestart', () => choroplethRenderer.current?.stopAnimation())
      map.on('moveend', () => choroplethRenderer.current?.startAnimation())
    } else {
      choroplethRenderer.current.updateVectorField(imageData)
    }
  }, [imageData, map])
  return null
}
