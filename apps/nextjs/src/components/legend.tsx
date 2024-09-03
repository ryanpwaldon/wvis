import React, { useMemo } from 'react'
import { scaleLinear } from 'd3-scale'

import { cn } from '@sctv/ui'

interface LegendProps {
  min: number
  max: number
  steps: number
  colorRamp: Uint8ClampedArray
  className?: string
}

export const Legend: React.FC<LegendProps> = ({ min, max, steps, colorRamp, className }) => {
  const scale = useMemo(() => scaleLinear().domain([min, max]).range([0, 100]).ticks(steps), [min, max, steps])
  const url = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = colorRamp.length / 4
    canvas.height = 1
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas.toDataURL()
    const imageData = new ImageData(colorRamp, canvas.width, 1)
    ctx.putImageData(imageData, 0, 0)
    return canvas.toDataURL()
  }, [colorRamp])

  return (
    <div className={cn('relative flex h-full w-full flex-col', className)}>
      {scale.map((tick) => (
        <div
          key={tick}
          style={{ left: `${((tick - min) / (max - min)) * 100}%` }}
          className="absolute z-10 flex h-full select-none flex-col border-l pl-1 last:hidden"
        >
          <div className="flex h-full items-center text-[0.6rem]">{tick}</div>
          <div className="h-full" />
        </div>
      ))}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} className="pointer-events-none absolute bottom-0 left-0 h-1/2 w-full select-none" />
    </div>
  )
}
