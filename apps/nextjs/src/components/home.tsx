'use client'

import { useState } from 'react'

import { Mapbox } from '~/components/mapbox'
import { MapboxParticleLayer } from './mapbox-particle-layer'
import { Timeline } from './timeline'

export const Home = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  return (
    <div className="h-full w-full p-4">
      <div className="flex h-full w-full flex-col divide-y overflow-hidden border">
        <Mapbox>
          <MapboxParticleLayer />
        </Mapbox>
        <Timeline steps={3} days={7} value={selectedDate} onChange={setSelectedDate} />
      </div>
    </div>
  )
}
