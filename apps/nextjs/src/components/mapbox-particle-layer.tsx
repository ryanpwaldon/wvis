'use client'

import { useEffect, useRef } from 'react'

import type { VectorGrid } from '~/hooks/useVectorGrid'
import { useMapbox } from '~/hooks/useMapbox'
import { ParticleRenderer } from '~/utils/particleRenderer'

interface MapboxParticleLayerProps {
  vectorGrid: VectorGrid | null
}

export const MapboxParticleLayer = ({ vectorGrid }: MapboxParticleLayerProps) => {
  const map = useMapbox()
  const particleRenderer = useRef<ParticleRenderer | null>(null)

  useEffect(() => {
    if (!vectorGrid) return
    if (!particleRenderer.current) {
      map.addLayer(
        {
          id: 'particle-renderer',
          type: 'custom',
          onAdd: (map, gl) => {
            particleRenderer.current = new ParticleRenderer(map, gl)
            particleRenderer.current.initialize(vectorGrid)
          },
          render: () => particleRenderer.current?.draw(),
        },
        'settlement-subdivision-label',
      )
      map.on('movestart', () => particleRenderer.current?.stopAnimation())
      map.on('moveend', () => particleRenderer.current?.startAnimation())
      map.on('resize', () => particleRenderer.current?.resizeTextures())
    } else {
      particleRenderer.current.updateVectorField(vectorGrid)
    }
  }, [vectorGrid, map])
  return null
}
