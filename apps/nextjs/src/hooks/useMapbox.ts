import { useContext } from 'react'

import { MapboxContext } from '~/components/mapbox'

export const useMapbox = () => {
  const map = useContext(MapboxContext)
  if (!map) throw new Error('useMapbox must be used within a Mapbox component')
  return map
}
