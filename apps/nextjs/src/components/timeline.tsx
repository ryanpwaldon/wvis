import React, { useEffect, useMemo, useState } from 'react'
import * as Slider from '@radix-ui/react-slider'
import { addHours, closestIndexTo, startOfDay, startOfHour } from 'date-fns'

import { cn } from '@sctv/ui'

interface TimelineProps {
  onChange: (date: Date) => void
  days: number
  interval: number
}

export const Timeline = ({ onChange, days, interval }: TimelineProps) => {
  const dates = useMemo(() => generateDateIntervals(days, 1), [days])
  // const formattedDates = useMemo(() => getFormattedDates(dates), [dates])
  const [index, setIndex] = useState(getClosestDateIndex(dates))

  useEffect(() => {
    const date = roundToInterval(dates[index] as unknown as Date, interval)
    onChange(date)
  }, [dates, index, interval, onChange])

  return (
    <div className="relative w-full touch-none select-none rounded-full border bg-background/60 px-6 backdrop-blur-xl active:bg-background/80">
      <Slider.Root
        min={0}
        max={dates.length - 1}
        value={[index]}
        onValueChange={(value) => setIndex(value[0] as unknown as number)}
        className="relative flex w-full touch-none select-none items-center py-6"
      >
        {dates.map((_, i) => {
          if (i % 24 !== 0) return
          return (
            <div
              key={i}
              className={cn('absolute h-1 w-1 -translate-x-1/2 rounded-full bg-primary/30')}
              style={{ left: calcStepMarkOffset(i, dates.length - 1) }}
            />
          )
        })}
        <Slider.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background focus-visible:outline-none" />
      </Slider.Root>
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

// const getFormattedDays = (dates: Date[], dateFormat = 'EEE d') => {
//   const uniqueDays = new Set<string>()
//   const formattedStartOfDays: string[] = []
//   dates.forEach((date) => {
//     const startOfDayDate = startOfDay(date)
//     const dayKey = startOfDayDate.toISOString()
//     if (!uniqueDays.has(dayKey)) {
//       uniqueDays.add(dayKey)
//       formattedStartOfDays.push(format(startOfDayDate, dateFormat))
//     }
//   })
//   formattedStartOfDays.pop()
//   return formattedStartOfDays
// }

// const getFormattedDates = (dates: Date[], dateFormat = 'EEEE do MMMM ha') => {
//   return dates.map((date) => format(date, dateFormat))
// }

const THUMB_SIZE = 16

function calcStepMarkOffset(index: number, maxIndex: number) {
  const percent = convertValueToPercentage(index, 0, maxIndex)
  const thumbInBoundsOffset = getThumbInBoundsOffset(THUMB_SIZE, percent, 1)
  return `calc(${percent}% + ${thumbInBoundsOffset}px)`
}

function convertValueToPercentage(value: number, min: number, max: number) {
  const maxSteps = max - min
  const percentPerStep = 100 / maxSteps
  const percentage = percentPerStep * (value - min)
  return clamp(percentage, { max: 100, min: 0 })
}

function getThumbInBoundsOffset(width: number, left: number, direction: number) {
  const halfWidth = width / 2
  const halfPercent = 50
  const offset = linearScale([0, halfPercent], [0, halfWidth])
  return (halfWidth - offset(left) * direction) * direction
}

function linearScale(input: readonly [number, number], output: readonly [number, number]) {
  return (value: number) => {
    if (input[0] === input[1] || output[0] === output[1]) return output[0]
    const ratio = (output[1] - output[0]) / (input[1] - input[0])
    return output[0] + ratio * (value - input[0])
  }
}

function clamp(value: number, { min, max }: { min: number; max: number }): number {
  return Math.min(Math.max(value, min), max)
}
