import React, { useCallback, useEffect, useState } from 'react'
import { add, format, isAfter, isBefore, startOfDay } from 'date-fns'

import { Slider } from '@sctv/ui/slider'

enum Step {
  One = 1,
  Two = 2,
  Three = 3,
  Four = 4,
  Six = 6,
  Eight = 8,
  Twelve = 12,
}

const roundToNearestInterval = (date: Date, interval: Step): Date => {
  console.log('local', date.toISOString())
  const currentHour = date.getUTCHours()
  const roundedHour = Math.round(currentHour / interval) * interval
  const roundedDate = new Date(date)
  roundedDate.setUTCHours(roundedHour, 0, 0, 0)
  console.log('rounded', roundedDate.toISOString())
  return roundedDate
}

interface TimelineProps {
  steps: Step
  days: number
  value: Date | null
  onChange: (date: Date) => void
}

export const Timeline = ({ steps, days, value, onChange }: TimelineProps) => {
  const [sliderValue, setSliderValue] = useState<number>(0)

  const startDate = startOfDay(new Date())
  const endDate = add(startDate, { days })

  const totalHours = days * 24
  const stepsCount = totalHours / steps

  const clampToStep = useCallback(
    (date: Date): Date => {
      const hoursSinceStart = (date.getTime() - startDate.getTime()) / (1000 * 60 * 60)
      const clampedHours = Math.floor(hoursSinceStart / steps) * steps
      return roundToNearestInterval(add(startDate, { hours: clampedHours }), steps)
    },
    [startDate, steps],
  )

  useEffect(() => {
    if (value === null) {
      const now = new Date()
      const initialValue = clampToStep(now)
      onChange(initialValue)
    } else {
      const roundedValue = roundToNearestInterval(value, steps)
      const hours = (roundedValue.getTime() - startDate.getTime()) / (1000 * 60 * 60)
      setSliderValue(hours / steps)
    }
  }, [value, steps, startDate, clampToStep, onChange])

  const handleSliderChange = ([newValue]: number[]) => {
    if (typeof newValue !== 'number') return
    const hours = newValue * steps
    const newDate = add(startDate, { hours })
    const roundedDate = roundToNearestInterval(newDate, steps)

    if (isBefore(roundedDate, startDate)) {
      onChange(startDate)
    } else if (isAfter(roundedDate, endDate)) {
      onChange(endDate)
    } else {
      onChange(roundedDate)
    }
  }

  const formatSliderValue = (value: number): string => {
    const date = roundToNearestInterval(add(startDate, { hours: value * steps }), steps)
    return format(date, 'MMM d, yyyy HH:mm')
  }

  return (
    <div className="w-full p-2">
      <Slider min={0} max={stepsCount} step={1} value={[sliderValue]} onValueChange={handleSliderChange} />
      <div className="mt-2 text-center">{formatSliderValue(sliderValue)}</div>
    </div>
  )
}
