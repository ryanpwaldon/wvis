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
      return add(startDate, { hours: clampedHours })
    },
    [startDate, steps],
  )

  useEffect(() => {
    if (value === null) {
      const now = new Date()
      const initialValue = clampToStep(now)
      onChange(initialValue)
    } else {
      const hours = (value.getTime() - startDate.getTime()) / (1000 * 60 * 60)
      setSliderValue(hours / steps)
    }
  }, [value, steps, startDate, clampToStep, onChange])

  const handleSliderChange = ([newValue]: number[]) => {
    if (typeof newValue !== 'number') return
    const hours = newValue * steps
    const newDate = add(startDate, { hours })

    if (isBefore(newDate, startDate)) {
      onChange(startDate)
    } else if (isAfter(newDate, endDate)) {
      onChange(endDate)
    } else {
      onChange(newDate)
    }
  }

  const formatSliderValue = (value: number): string => {
    const date = add(startDate, { hours: value * steps })
    return format(date, 'MMM d, yyyy HH:mm')
  }

  return (
    <div className="w-full p-2">
      <Slider min={0} max={stepsCount} step={1} value={[sliderValue]} onValueChange={handleSliderChange} />
      <div className="mt-2 text-center">{formatSliderValue(sliderValue)}</div>
    </div>
  )
}
