import React, { useEffect, useMemo, useState } from 'react'
import { addHours, closestIndexTo, format, startOfDay, startOfHour } from 'date-fns'

import { Slider } from '@sctv/ui/slider'

interface TimelineProps {
  onChange: (date: Date) => void
  days: number
  interval: number
}

export const Timeline = ({ onChange, days, interval }: TimelineProps) => {
  const dates = useMemo(() => generateDateIntervals(days, interval), [days, interval])
  const [index, setIndex] = useState(getClosestDateIndex(dates))
  const indexToFormattedDate = (index: number): string => format(dates[index] as unknown as Date, 'MMM d, yyyy HH:mm')

  useEffect(() => {
    const date = roundToInterval(dates[index] as unknown as Date, interval)
    onChange(date)
  }, [dates, index, interval, onChange])

  return (
    <div className="w-full p-2">
      <Slider min={0} max={dates.length - 1} step={1} value={[index]} onValueChange={(value) => setIndex(value[0] as unknown as number)} />
      <div className="mt-2 text-center">{indexToFormattedDate(index)}</div>
    </div>
  )
}

const roundToInterval = (date: Date, interval: number) => {
  const currentHour = date.getUTCHours()
  const roundedHour = Math.round(currentHour / interval) * interval
  return addHours(startOfHour(date), roundedHour - currentHour)
}

const generateDateIntervals = (days: number, interval: number): Date[] => {
  if (24 % interval !== 0) throw new Error(`The interval must be a divisor of 24. The provided interval (${interval}) is invalid.`)
  const intervals: Date[] = []
  const now = new Date()
  const startDate = startOfDay(now)
  for (let hour = 0; hour <= days * 24; hour += interval) intervals.push(addHours(startDate, hour))
  return intervals
}

const getClosestDateIndex = (dates: Date[]) => {
  const now = new Date()
  const closestIndex = closestIndexTo(now, dates)
  if (closestIndex === undefined) throw new Error('No dates passed.')
  return closestIndex
}
