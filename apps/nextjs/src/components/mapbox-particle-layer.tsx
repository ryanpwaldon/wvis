'use client'

import { useEffect, useRef } from 'react'

import { useMapbox } from '~/hooks/useMapbox'
import { ParticleRenderer } from '~/utils/particleRenderer'

interface MapboxParticleLayerProps {
  imageData: ImageData | null
}

export const MapboxParticleLayer = ({ imageData }: MapboxParticleLayerProps) => {
  const map = useMapbox()
  const particleRenderer = useRef<ParticleRenderer | null>(null)

  useEffect(() => {
    if (!imageData) return
    if (!particleRenderer.current) {
      map.addLayer(
        {
          id: 'particle-renderer',
          type: 'custom',
          onAdd: (map, gl) => {
            particleRenderer.current = new ParticleRenderer(map, gl)
            particleRenderer.current.initialize(imageData)
          },
          render: () => particleRenderer.current?.draw(),
        },
        'settlement-subdivision-label',
      )
      map.on('movestart', () => particleRenderer.current?.stopAnimation())
      map.on('moveend', () => particleRenderer.current?.startAnimation())
    } else {
      particleRenderer.current.updateVectorField(imageData)
    }
  }, [imageData, map])
  return null
}
