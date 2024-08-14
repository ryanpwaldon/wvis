'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@sctv/ui'

import useMap from '~/hooks/useMap'

interface MapboxProps {
  className?: string
}

export const Mapbox = ({ className }: MapboxProps) => {
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
    <div className={cn('relative h-full w-full bg-background [&_.mapboxgl-map_.mapboxgl-ctrl-logo]:!hidden [&_canvas]:!outline-none', className)}>
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  )
}
