'use client'

import { useMemo, useState } from 'react'

import { CLOUDFLARE_BUCKET_URL } from '@sctv/constants'
import { ThemeToggle } from '@sctv/ui/theme'

import { Mapbox } from '~/components/mapbox'
import useImageData from '~/hooks/useImageData'
import { MapboxChoroplethLayer } from './mapbox-choropleth-layer'
import { MapboxParticleLayer } from './mapbox-particle-layer'
import { Timeline } from './timeline'

export const Home = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const selectedImageUrl = useMemo(() => selectedDate && `${CLOUDFLARE_BUCKET_URL}/wind/${selectedDate.toISOString()}.png`, [selectedDate])
  const { imageData } = useImageData(selectedImageUrl)

  return (
    <div className="h-full w-full border p-4">
      <div className="flex h-full w-full flex-col divide-y overflow-hidden border">
        <Mapbox>
          <MapboxParticleLayer imageData={imageData} />
          <MapboxChoroplethLayer imageData={imageData} />
        </Mapbox>
        <div className="flex h-8 w-full justify-end bg-card text-card-foreground">
          <ThemeToggle />
        </div>
      </div>
      <div className="hidden">
        <Timeline onChange={setSelectedDate} interval={3} days={7} />
      </div>
    </div>
  )
}
