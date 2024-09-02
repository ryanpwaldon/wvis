import { useEffect, useMemo, useRef } from 'react'
import { ticks as createTicks } from 'd3-array'

interface LegendProps {
  steps: number
  min?: number
  max: number
  colorRamp: Uint8ClampedArray
}

export const Legend = ({ colorRamp, steps, min = 0, max }: LegendProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ticks = useMemo(() => createTicks(min, max, steps), [steps, min, max])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = colorRamp.length / 4
    canvas.height = 1
    const imageData = new ImageData(colorRamp, canvas.width, 1)
    ctx.putImageData(imageData, 0, 0)
  }, [colorRamp])

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="absolute left-0 top-0 flex h-full w-full">
        {ticks.slice(0, ticks.length - 1).map((tick) => (
          <div className="h-full w-full border-l first:border-l-0" key={tick} />
        ))}
      </div>
      <div className="flex h-1/2 w-full">
        {ticks.slice(0, ticks.length - 1).map((tick) => (
          <div className="w-full pl-1 text-[0.6rem]" key={tick}>
            {tick}
          </div>
        ))}
      </div>
      <canvas ref={canvasRef} className="block h-1/2 w-full" />
    </div>
  )
}
