import type { MapOptions, StyleSpecification } from 'mapbox-gl'
import type { RefObject } from 'react'
import { useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'

import 'mapbox-gl/dist/mapbox-gl.css'

import { mapboxStyle } from '~/components/mapbox-style'
import { env } from '~/env'

mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN'

interface UseMapProps {
  mapContainerRef: RefObject<HTMLDivElement>
  options?: Omit<MapOptions, 'container'>
}

const defaultOptions: Partial<Omit<MapOptions, 'container'>> = {
  zoom: 9,
  center: [-74.5, 40],
  style: mapboxStyle as StyleSpecification,
  attributionControl: false,
}

const useMap = ({ mapContainerRef, options }: UseMapProps) => {
  const [map, setMap] = useState<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (mapContainerRef.current && !map) {
      const mapInstance = new mapboxgl.Map({
        container: mapContainerRef.current,
        accessToken: env.NEXT_PUBLIC_MAPBOX_API_KEY,
        ...defaultOptions,
        ...options,
      })

      mapInstance.on('load', () => {
        setMap(mapInstance)
      })
    }

    return () => {
      if (map?.remove) map.remove()
    }
  }, [mapContainerRef, map, options])

  return { map }
}

export default useMap
