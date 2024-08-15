'use client'

import { useMapbox } from '~/hooks/useMapbox'

interface MapboxParticleLayerProps {
  amount?: number
}

export const MapboxParticleLayer = ({ amount = 1000 }: MapboxParticleLayerProps) => {
  const map = useMapbox()
  console.log(map.loaded())
  amount.toFixed()

  return null
}
