'use client'

import { useMemo, useState } from 'react'

import { CLOUDFLARE_BUCKET_URL } from '@sctv/constants'

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
      <div className="relative h-full w-full overflow-hidden">
        <Mapbox>
          <MapboxParticleLayer imageData={imageData} />
          <MapboxChoroplethLayer imageData={imageData} />
        </Mapbox>
        <div className="absolute bottom-0 left-0 w-full p-4">
          <Timeline onChange={setSelectedDate} interval={3} days={7} />
        </div>
      </div>
    </div>
  )
}
