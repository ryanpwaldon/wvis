'use client'

import { useMemo, useRef, useState } from 'react'

import type { VectorGridId } from '@sctv/shared'
import { convertDistance, degreesToCompass, vectorGridConfigs } from '@sctv/shared'
import { Button } from '@sctv/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@sctv/ui/dropdown-menu'
import { ThemeToggle } from '@sctv/ui/theme'

import { Mapbox } from '~/components/mapbox'
import { useColorRamp } from '~/hooks/useColorRamp'
import { useVectorGrid } from '~/hooks/useVectorGrid'
import { Legend } from './legend'
import { MapboxChoroplethLayer } from './mapbox-choropleth-layer'
import { MapboxParticleLayer } from './mapbox-particle-layer'
import { Timeline } from './timeline'

export const Home = () => {
  const [date, setDate] = useState<Date | null>(null)
  const [cursorLngLat, setCursorLngLat] = useState<[number, number] | null>(null)
  const [vectorGridId, setVectorGridId] = useState<VectorGridId>('wind')
  const vectorGridConfig = useMemo(() => vectorGridConfigs[vectorGridId], [vectorGridId])
  const { vectorGrid, queryVectorGrid } = useVectorGrid({ vectorGridId, date })
  const vectorGridPoint = useMemo(() => queryVectorGrid(cursorLngLat), [cursorLngLat, queryVectorGrid])
  const { colorRamp } = useColorRamp({ palette: 'turbo' })

  const boundaryRef = useRef<HTMLDivElement | null>(null)

  return (
    <div className="h-full w-full border p-4">
      <div ref={boundaryRef} className="flex h-full w-full flex-col divide-y overflow-hidden border">
        <div className="flex h-8 w-full justify-between bg-card text-card-foreground">
          <div className="flex h-full items-center">
            <div className="flex h-full items-center border-r px-2">SCTV</div>
          </div>
          <div className="flex h-full items-center">
            <div className="border-l">
              <ThemeToggle />
            </div>
          </div>
        </div>
        <Mapbox onCursorLngLatChange={setCursorLngLat}>
          <MapboxChoroplethLayer vectorGrid={vectorGrid} />
          <MapboxParticleLayer vectorGrid={vectorGrid} />
        </Mapbox>
        <div className="flex h-8 w-full justify-between bg-card text-card-foreground">
          <div className="flex h-full items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-8 border-r px-2 text-xs font-light" variant="ghost">
                  {vectorGridConfig.title}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent sideOffset={3} alignOffset={2} align="start">
                <DropdownMenuRadioGroup value={vectorGridId} onValueChange={setVectorGridId as (value: string) => void}>
                  {Object.values(vectorGridConfigs).map((layer) => (
                    <DropdownMenuRadioItem key={layer.id} value={layer.id}>
                      {layer.title}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex h-full items-center">
            {/* {vectorGridPoint && (
              <div className="flex h-full items-center border-r px-2">
                {degreesToCompass(vectorGridPoint.direction)}, {convertDistance(vectorGridPoint.magnitude, 'meters', 'feet').toFixed(0)}
              </div>
            )} */}
            <div className="h-full w-[300px]">{vectorGrid && <Legend colorRamp={colorRamp} min={0} max={vectorGrid.config.magMax} steps={6} />}</div>
          </div>
        </div>
      </div>
      <div className="hidden">
        <Timeline onChange={setDate} interval={3} days={7} />
      </div>
    </div>
  )
}
