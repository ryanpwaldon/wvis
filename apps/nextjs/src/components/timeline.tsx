import { useEffect, useState } from 'react'
import { addHours, differenceInHours, format, startOfDay } from 'date-fns'

import { cn } from '@sctv/ui'
import { Slider } from '@sctv/ui/slider'

interface TimelineProps {
  className?: string
  value: Date
  onChange: (date: Date) => void
}

export const Timeline = ({ className, value, onChange }: TimelineProps) => {
  const startDate = startOfDay(new Date())
  const totalHours = 16 * 24 // 16 days * 24 hours
  const [sliderValue, setSliderValue] = useState(0)

  useEffect(() => {
    const hoursSinceStart = differenceInHours(value, startDate)
    setSliderValue(hoursSinceStart)
  }, [value, startDate])

  const formatSliderLabel = (hours: number): string => {
    const date = addHours(startDate, hours)
    return format(date, 'MMM d, h aa')
  }

  const handleSliderChange = (newValue: number[]) => {
    if (newValue[0] !== undefined) {
      const newDate = addHours(startDate, newValue[0])
      onChange(newDate)
    }
  }

  return (
    <div className={cn('w-full px-4 py-8', className)}>
      <Slider min={0} max={totalHours - 1} step={1} value={[sliderValue]} onValueChange={handleSliderChange} className="w-full" />
      <div className="mt-4 flex justify-between text-sm text-gray-600">
        <span>{formatSliderLabel(0)}</span>
        <span>{formatSliderLabel(totalHours - 1)}</span>
      </div>
      <div className="mt-2 text-center text-lg font-semibold">{formatSliderLabel(sliderValue)}</div>
    </div>
  )
}
