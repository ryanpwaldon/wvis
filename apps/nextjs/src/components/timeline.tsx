import React, { RefObject, useEffect, useState } from 'react'
import * as Slider from '@radix-ui/react-slider'
import { addHours, closestIndexTo, format, startOfDay } from 'date-fns'

import { cn } from '@sctv/ui'
import { Tooltip, TooltipContent, TooltipTrigger } from '@sctv/ui/tooltip'

const UTC_HOUR_START = 0 // 12am UTC
const UTC_HOUR_INTERVAL = 3

interface TimelineProps {
  days: number
  onChange: (value: Date) => void
  boundary: RefObject<HTMLDivElement>
  className?: string
}

export const Timeline = ({ days, onChange, boundary, className }: TimelineProps) => {
  const now = new Date()
  const max = days * 24
  const dates = Array(max + 1).fill(null).map((_, i) => addHours(startOfDay(now), i)) // prettier-ignore
  const validDates = dates.map((date) => (new Date(date.toUTCString()).getUTCHours() % UTC_HOUR_INTERVAL === UTC_HOUR_START ? date : null))
  const clamp = (index: number) => closestDateIndex(dates[index], validDates)
  const [index, setIndex] = useState(closestDateIndex(now, validDates))
  useEffect(() => onChange(dates[clamp(index)]!), [])

  const handleIndexChange = ([index]: [number]) => {
    setIndex(index)
    onChange(dates[clamp(index)]!)
  }

  return (
    <div className={cn('relative h-full w-full px-4', className)}>
      <Slider.Root step={1} min={0} max={max} value={[index]} onValueChange={handleIndexChange} className="relative flex h-full w-full touch-none select-none">
        <Ticks divisions={5} subdivisions={24} className="absolute left-0 top-0" />
        <Slider.Track className="relative h-full grow">
          <Slider.Range className="absolute h-full">
            <Tooltip open>
              <TooltipTrigger asChild>
                <div className="absolute right-0 flex h-full translate-x-1/2 items-center">
                  <div className="h-2/3 w-1 rounded-full bg-yellow-400" />
                </div>
              </TooltipTrigger>
              <TooltipContent
                align="center"
                sideOffset={0}
                updatePositionStrategy="always"
                collisionBoundary={boundary.current}
                className="border bg-background p-0 text-foreground"
              >
                <div className="flex divide-x p-0">
                  <div className="px-2 py-1.5">{format(dates[index]!, 'EEE d')}</div>
                  <div className="px-2 py-1.5">{format(dates[index]!, 'ha')}</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </Slider.Range>
        </Slider.Track>
      </Slider.Root>
    </div>
  )
}

const closestDateIndex = (date: Date | undefined, dates: Array<Date | null>) => {
  if (!date) throw new Error('Date is undefined.')
  const index = closestIndexTo(date, dates.map((date) => date ?? 0)) // prettier-ignore
  if (index === undefined) throw new Error('No closest index found.')
  return index
}

interface TicksProps {
  divisions: number
  subdivisions: number
  className?: string
}

const Ticks = ({ divisions, subdivisions, className }: TicksProps) => {
  const totalTicks = divisions * subdivisions
  return (
    <div className={cn('flex h-full w-full items-center', className)}>
      {Array.from({ length: totalTicks + 1 }, (_, tick) => {
        const percentage = (tick / totalTicks) * 100
        const isMajorTick = tick % subdivisions === 0
        return (
          <div
            key={tick}
            style={{ left: `${percentage}%` }}
            className={cn('absolute w-px -translate-x-1/2', isMajorTick ? 'h-1/2 bg-foreground/30' : 'h-1/3 bg-foreground/20')}
          />
        )
      })}
    </div>
  )
}
