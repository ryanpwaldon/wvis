'use client'

import { useMemo, useRef, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'

import type { VectorGridId } from '@sctv/shared'
import { convertSpeed, degreesToCompass, vectorGridConfigs } from '@sctv/shared'
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
  const [cursorLngLat, setCursorLngLat] = useState<[number, number] | null>(null)
  const [vectorGridId, setVectorGridId] = useState<VectorGridId>('wind')
  const vectorGridConfig = useMemo(() => vectorGridConfigs[vectorGridId], [vectorGridId])
  const vectorGridUrl = useMemo(() => date && vectorGridConfig.url(date), [date, vectorGridConfig])
  const { vectorGrid, queryVectorGrid } = useVectorGrid(vectorGridUrl)
  const vectorGridPoint = useMemo(() => queryVectorGrid(cursorLngLat), [cursorLngLat, queryVectorGrid])

  const boundaryRef = useRef<HTMLDivElement | null>(null)

  return (
    <div className="h-full w-full border p-4">
      <div ref={boundaryRef} className="flex h-full w-full flex-col divide-y overflow-hidden border">
        <Mapbox onCursorLngLatChange={setCursorLngLat}>
          <MapboxParticleLayer vectorGrid={vectorGrid} />
          <MapboxChoroplethLayer vectorGrid={vectorGrid} />
        </Mapbox>
        <div className="flex h-8 w-full justify-between bg-card text-card-foreground">
          <div className="flex h-full items-center">
            <div className="px-2">{date ? format(date, 'EEEE d MMMM h:mm a') : ''}</div>
          </div>
          <div className="flex h-full items-center">
            {vectorGridPoint && (
              <div className="flex h-full items-center border-r px-2">
                {degreesToCompass(vectorGridPoint.direction)}, {convertSpeed(vectorGridPoint.magnitude, 'mps', 'kph').toFixed(2)}
              </div>
            )}
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
                  {Object.values(vectorGridConfigs).map((layer) => (
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
