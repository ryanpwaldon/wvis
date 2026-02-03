'use client'

import { useEffect, useRef } from 'react'

import type { VectorGrid } from '~/hooks/useVectorGrid'
import { useMapbox } from '~/hooks/useMapbox'
import { HeatmapRenderer } from '~/utils/heatmapRenderer'

interface MapboxHeatmapLayerProps {
  vectorGrid: VectorGrid | null
}

export const MapboxHeatmapLayer = ({ vectorGrid }: MapboxHeatmapLayerProps) => {
  const map = useMapbox()
  const heatmapRenderer = useRef<HeatmapRenderer | null>(null)

  useEffect(() => {
    if (!vectorGrid) return
    if (!heatmapRenderer.current) {
      map.addLayer({
        id: 'heatmap-renderer',
        type: 'custom',
        onAdd: (map, gl) => {
          heatmapRenderer.current = new HeatmapRenderer(map, gl)
          heatmapRenderer.current.updateMapBounds()
          heatmapRenderer.current.setVectorGrid(vectorGrid)
        },
        render: () => heatmapRenderer.current?.draw(),
      })
      map.on('move', () => heatmapRenderer.current?.updateMapBounds())
    } else {
      heatmapRenderer.current.setVectorGrid(vectorGrid)
    }
  }, [vectorGrid, map])
  return null
}
