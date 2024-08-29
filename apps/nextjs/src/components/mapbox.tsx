'use client'

import type { StyleSpecification } from 'mapbox-gl'
import React, { createContext, useEffect, useMemo, useRef, useState } from 'react'
import { Map } from 'mapbox-gl'
import { useTheme } from 'next-themes'

import 'mapbox-gl/dist/mapbox-gl.css'

import { cn } from '@sctv/ui'

import { env } from '~/env'
import { mapboxStyle } from './mapbox-style'

interface MapboxProps {
  className?: string
  children?: React.ReactNode
}

export const MapboxContext = createContext<Map | null>(null)

export const Mapbox = ({ className, children }: MapboxProps) => {
  const { theme } = useTheme()
  const mapRef = useRef<Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const mapStyle = useMemo(() => (theme === 'light' ? mapboxStyle('light') : mapboxStyle('dark')), [theme])

  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current) {
      mapRef.current = new Map({
        zoom: 1.5,
        center: [-180, 0],
        attributionControl: false,
        projection: { name: 'mercator' },
        container: mapContainerRef.current,
        style: mapStyle as StyleSpecification,
        accessToken: env.NEXT_PUBLIC_MAPBOX_API_KEY,
      })
      mapRef.current.on('load', () => setIsMapReady(true))
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => void mapRef.current?.setStyle(mapStyle as StyleSpecification), [mapStyle])

  return (
    <div
      className={cn(
        'relative h-full w-full bg-background [&_.mapboxgl-map_.mapboxgl-ctrl-logo]:!hidden [&_canvas]:!cursor-default [&_canvas]:!outline-none',
        className,
      )}
    >
      <div ref={mapContainerRef} className="h-full w-full" />
      <MapboxContext.Provider value={mapRef.current}>{isMapReady && children}</MapboxContext.Provider>
    </div>
  )
}
