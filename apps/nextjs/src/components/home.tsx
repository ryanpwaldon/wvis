'use client'

import { useMemo, useRef, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'

import type { WeatherLayerId } from '@sctv/shared'
import { WEATHER_LAYERS } from '@sctv/shared'
import { Button } from '@sctv/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@sctv/ui/dropdown-menu'
import { ThemeToggle } from '@sctv/ui/theme'
import { Tooltip, TooltipContent, TooltipTrigger } from '@sctv/ui/tooltip'

import { Mapbox } from '~/components/mapbox'
import useImageData from '~/hooks/useImageData'
import { MapboxChoroplethLayer } from './mapbox-choropleth-layer'
import { MapboxParticleLayer } from './mapbox-particle-layer'
import { Timeline } from './timeline'

export const Home = () => {
  const [selectedWeatherLayerId, setSelectedWeatherLayerId] = useState<WeatherLayerId>('waves')
  const selectedLayer = useMemo(() => WEATHER_LAYERS[selectedWeatherLayerId], [selectedWeatherLayerId])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const layerImage = useMemo(() => selectedDate && selectedLayer.imageUrlTemplate(selectedDate), [selectedDate, selectedLayer])
  const { imageData } = useImageData(layerImage)
  const boundaryRef = useRef<HTMLDivElement | null>(null)

  return (
    <div className="h-full w-full border p-4">
      <div ref={boundaryRef} className="flex h-full w-full flex-col divide-y overflow-hidden border">
        <Mapbox>
          <MapboxParticleLayer imageData={imageData} />
          <MapboxChoroplethLayer imageData={imageData} />
        </Mapbox>
        <div className="flex h-8 w-full justify-between bg-card text-card-foreground">
          <div className="flex h-full items-center">
            <div className="px-2">{selectedDate ? format(selectedDate, 'EEEE d MMMM h:mm a') : ''}</div>
          </div>
          <div className="flex h-full items-center">
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
                <DropdownMenuRadioGroup value={selectedWeatherLayerId} onValueChange={setSelectedWeatherLayerId as (value: string) => void}>
                  {Object.values(WEATHER_LAYERS).map((layer) => (
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
        <Timeline onChange={setSelectedDate} interval={3} days={7} />
      </div>
    </div>
  )
}
