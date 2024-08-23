'use client'

import { useMemo, useRef, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'

import { CLOUDFLARE_BUCKET_URL } from '@sctv/constants'
import { ThemeToggle } from '@sctv/ui/theme'
import { Tooltip, TooltipContent, TooltipTrigger } from '@sctv/ui/tooltip'

import { Mapbox } from '~/components/mapbox'
import useImageData from '~/hooks/useImageData'
import { MapboxChoroplethLayer } from './mapbox-choropleth-layer'
import { MapboxParticleLayer } from './mapbox-particle-layer'
import { Timeline } from './timeline'

export const Home = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const selectedImageUrl = useMemo(() => selectedDate && `${CLOUDFLARE_BUCKET_URL}/wind/${selectedDate.toISOString()}.png`, [selectedDate])
  const { imageData } = useImageData(selectedImageUrl)
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
