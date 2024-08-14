'use client'

import { useRef } from 'react'

import useMap from '~/hooks/useMap'

export const Mapbox = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  useMap({
    mapContainerRef,
    options: {
      center: [-74.5, 40],
      zoom: 9,
    },
  })
  return (
    <div className="relative h-full w-full bg-background [&_.mapboxgl-map_.mapboxgl-ctrl-logo]:hidden [&_canvas]:outline-none">
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  )
}
