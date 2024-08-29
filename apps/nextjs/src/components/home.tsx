'use client'

import type { LngLat } from 'mapbox-gl'
import { useMemo, useRef, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'

import type { VectorGridId } from '@sctv/shared'
import { convertSpeed, degreesToCompass, vectorGrids } from '@sctv/shared'
import { Button } from '@sctv/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@sctv/ui/dropdown-menu'
import { ThemeToggle } from '@sctv/ui/theme'
import { Tooltip, TooltipContent, TooltipTrigger } from '@sctv/ui/tooltip'

import { Mapbox } from '~/components/mapbox'
import { useVectorGrid } from '~/hooks/useVectorGrid'
import { MapboxChoroplethLayer } from './mapbox-choropleth-layer'
import { MapboxParticleLayer } from './mapbox-particle-layer'
import { Timeline } from './timeline'

export const Home = () => {
  const [date, setDate] = useState<Date | null>(null)
  const [cursorLngLat, setCursorLngLat] = useState<LngLat | null>(null)
  const [vectorGridId, setVectorGridId] = useState<VectorGridId>('wind')
  const vectorGrid = useMemo(() => vectorGrids[vectorGridId], [vectorGridId])
  const vectorGridUrl = useMemo(() => date && vectorGrid.url(date), [date, vectorGrid])
  const { vectorGridData, queryVectorGrid } = useVectorGrid(vectorGridUrl)
  const vectorPixel = useMemo(() => {
    if (!cursorLngLat) return null
    const x = ((cursorLngLat.lng % 360) / 360) * 359
    const y = ((90 - cursorLngLat.lat) / 180) * 180
    const rgba = queryVectorGrid(Math.round(x), Math.round(y))
    if (!rgba) return null
    const red = rgba[0]
    const green = rgba[1]
    const u = (red / 255) * 200 - 100
    const v = (green / 255) * 200 - 100
    const magnitude = convertSpeed(Math.sqrt(u * u + v * v), 'mps', 'kph')
    const direction = degreesToCompass((Math.atan2(-u, -v) * (180 / Math.PI) + 360) % 360)
    return { direction, magnitude }
  }, [cursorLngLat, queryVectorGrid])

  const boundaryRef = useRef<HTMLDivElement | null>(null)

  return (
    <div className="h-full w-full border p-4">
      <div ref={boundaryRef} className="flex h-full w-full flex-col divide-y overflow-hidden border">
        <Mapbox onCursorLngLatChange={setCursorLngLat}>
          <MapboxParticleLayer vectorGridData={vectorGridData} />
          <MapboxChoroplethLayer vectorGridData={vectorGridData} />
        </Mapbox>
        <div className="flex h-8 w-full justify-between bg-card text-card-foreground">
          <div className="flex h-full items-center">
            <div className="px-2">{date ? format(date, 'EEEE d MMMM h:mm a') : ''}</div>
          </div>
          <div className="flex h-full items-center">
            <div className="flex h-full items-center border-r px-2">
              {vectorPixel?.direction}, {vectorPixel?.magnitude.toFixed(2)}
            </div>
            <Tooltip delayDuration={0}>
              <TooltipTrigger className="h-full border-r px-2">GFS / {formatDistanceToNow(new Date(), { addSuffix: true })}</TooltipTrigger>
              <TooltipContent sideOffset={2} collisionBoundary={boundaryRef.current}>
                Updated {format(new Date(), 'EEEE d MMMM h:mm a')}
              </TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-8 border-r px-2 text-xs font-light" variant="ghost">
                  Layer
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent sideOffset={2} align="end">
                <DropdownMenuRadioGroup value={vectorGridId} onValueChange={setVectorGridId as (value: string) => void}>
                  {Object.values(vectorGrids).map((layer) => (
                    <DropdownMenuRadioItem key={layer.id} value={layer.id}>
                      {layer.title}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle />
          </div>
        </div>
      </div>
      <div className="hidden">
        <Timeline onChange={setDate} interval={3} days={7} />
      </div>
    </div>
  )
}
