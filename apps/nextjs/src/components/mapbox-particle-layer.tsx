'use client'

import { useEffect, useRef } from 'react'

import { useMapbox } from '~/hooks/useMapbox'
import { ParticleRenderer } from '~/utils/particleRenderer'

interface MapboxParticleLayerProps {
  vectorGridData: ImageData | null
}

export const MapboxParticleLayer = ({ vectorGridData }: MapboxParticleLayerProps) => {
  const map = useMapbox()
  const particleRenderer = useRef<ParticleRenderer | null>(null)

  useEffect(() => {
    if (!vectorGridData) return
    if (!particleRenderer.current) {
      map.addLayer(
        {
          id: 'particle-renderer',
          type: 'custom',
          onAdd: (map, gl) => {
            particleRenderer.current = new ParticleRenderer(map, gl)
            particleRenderer.current.initialize(vectorGridData)
          },
          render: () => particleRenderer.current?.draw(),
        },
        'settlement-subdivision-label',
      )
      map.on('movestart', () => particleRenderer.current?.stopAnimation())
      map.on('moveend', () => particleRenderer.current?.startAnimation())
      map.on('resize', () => particleRenderer.current?.resizeTextures())
    } else {
      particleRenderer.current.updateVectorField(vectorGridData)
    }
  }, [vectorGridData, map])
  return null
}
