'use client'

import { useMapbox } from '~/hooks/useMapbox'

interface MapboxParticleLayer {
  amount?: number
}

export const MapboxParticleLayer = ({ amount = 1000 }: MapboxParticleLayer) => {
  const map = useMapbox()
  console.log(amount)
  console.log(map.isStyleLoaded())
  return null
}
