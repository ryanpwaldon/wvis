'use client'

// import { useMemo, useState } from 'react'
import { Mapbox } from '~/components/mapbox'
import useImageData from '~/hooks/useImageData'
import { MapboxChoroplethLayer } from './mapbox-choropleth-layer'

// import { Timeline } from './timeline'

export const Home = () => {
  // const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  // const selectedImageUrl = useMemo(() => selectedDate && `/wind-${selectedDate.toISOString()}.png`, [selectedDate])
  const { imageData } = useImageData('wind.png')

  return (
    <div className="h-full w-full p-4">
      <div className="flex h-full w-full flex-col divide-y overflow-hidden border">
        <Mapbox>
          {/* <MapboxParticleLayer imageData={imageData} /> */}
          <MapboxChoroplethLayer imageData={imageData} />
        </Mapbox>
        {/* <Timeline steps={3} days={7} value={selectedDate} onChange={setSelectedDate} /> */}
      </div>
    </div>
  )
}
