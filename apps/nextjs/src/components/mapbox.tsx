'use client'

import { useEffect, useRef, useState } from 'react'

import useMap from '~/hooks/useMap'

export const Mapbox = () => {
  const [mapInit, setMapInit] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const { map } = useMap({
    mapContainerRef,
    options: {
      center: [-74.5, 40],
      zoom: 2,
    },
  })

  useEffect(() => {
    if (map && !mapInit) {
      setMapInit(true)
      map.once('load', () => {
        return
      })
    }
  }, [map, mapInit])

  return (
    <div className="relative h-full w-full bg-background [&_.mapboxgl-map_.mapboxgl-ctrl-logo]:!hidden [&_canvas]:!outline-none">
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  )
}
