'use client'

import { useState } from 'react'
import { startOfDay } from 'date-fns'

import { Mapbox } from '~/components/mapbox'
import { Timeline } from './timeline'

export const Home = () => {
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()))
  const handleDateChange = (date: Date) => setSelectedDate(date)

  return (
    <div className="h-full w-full p-4">
      <div className="flex h-full w-full flex-col overflow-hidden border">
        <Mapbox />
        <Timeline value={selectedDate} onChange={handleDateChange} />
      </div>
    </div>
  )
}
