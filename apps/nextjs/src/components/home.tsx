'use client'

import React, { useMemo, useRef, useState } from 'react'

import type { Unit, VectorGridId } from '@sctv/shared'
import { convertUnit, degreesToCompass, vectorGridConfigs } from '@sctv/shared'
import { ThemeToggle } from '@sctv/ui/theme'

import type { Vector, VectorGrid } from '~/hooks/useVectorGrid'
import { Mapbox } from '~/components/mapbox'
import { useColorRamp } from '~/hooks/useColorRamp'
import { useVectorGrid } from '~/hooks/useVectorGrid'
import { LayerSelect } from './layer-select'
import { Legend } from './legend'
import { MapboxHeatmapLayer } from './mapbox-heatmap-layer'
import { MapboxParticleLayer } from './mapbox-particle-layer'
import { Timeline } from './timeline'
import { UnitSelect } from './unit-select'

export const Home = () => {
  const [date, setDate] = useState<Date | null>(null)
  const [cursorLngLat, setCursorLngLat] = useState<[number, number] | null>(null)
  const [vectorGridId, setVectorGridId] = useState<VectorGridId>('wind')
  const { vectorGrid, queryVectorGrid } = useVectorGrid({ vectorGridId, date })
  const defaultUnit = vectorGrid?.config.units.base ?? null
  const [unitOverride, setUnitOverride] = useState<Unit | null>(null)
  const unit = unitOverride ?? defaultUnit

  const vector = useMemo(() => queryVectorGrid(cursorLngLat), [cursorLngLat, queryVectorGrid])
  const { colorRamp } = useColorRamp({ palette: 'turbo' })

  const boundaryRef = useRef<HTMLDivElement | null>(null)

  const layerOptions = useMemo(
    () =>
      Object.values(vectorGridConfigs).map((config) => ({
        id: config.id,
        title: config.title,
      })),
    [],
  )

  return (
    <div className="h-full w-full p-4">
      <div ref={boundaryRef} className="flex h-full w-full flex-col divide-y overflow-hidden border">
        <div className="flex h-8 w-full justify-between bg-card text-card-foreground">
          <div className="flex h-full items-center border-r px-2">SCTV</div>
          <ThemeToggle className="border-l" />
        </div>
        <Mapbox onCursorLngLatChange={setCursorLngLat}>
          <MapboxHeatmapLayer vectorGrid={vectorGrid} />
          <MapboxParticleLayer vectorGrid={vectorGrid} />
        </Mapbox>
        <div className="flex h-8 w-full justify-between bg-card text-card-foreground">
          <Timeline onChange={setDate} days={5} boundary={boundaryRef} />
        </div>
        <div className="flex h-8 w-full justify-between bg-card text-card-foreground">
          <LayerSelect value={vectorGridId} onChange={setVectorGridId as (value: string) => void} options={layerOptions} />
          {vector && vectorGrid && unit && <VectorInfo vector={vector} vectorGrid={vectorGrid} unit={unit} />}
          <div className="w-full" />
          {vectorGrid && unit && (
            <UnitSelect className="border-l" value={unit} onChange={(value) => setUnitOverride(value as Unit)} options={[...vectorGrid.config.units.options]} />
          )}
          {vectorGrid && unit && (
            <Legend
              min={0}
              steps={6}
              colorRamp={colorRamp}
              max={convertUnit(vectorGrid.config.magMax, vectorGrid.config.units.base, unit)}
              className="w-[300px] flex-shrink-0"
            />
          )}
        </div>
      </div>
    </div>
  )
}

interface VectorGridPointProps {
  vector: Vector
  vectorGrid: VectorGrid
  unit: Unit
}

const VectorInfo: React.FC<VectorGridPointProps> = ({ vector, vectorGrid, unit }) => {
  const direction = degreesToCompass(vector.direction)
  const magnitude = convertUnit(vector.magnitude, vectorGrid.config.units.base, unit).toFixed(0)

  const formatValue = (value: string) => {
    const fillerChar = '-'
    const fillerCount = 3 - value.length
    return (
      <span className="inline-flex justify-end">
        <span className="opacity-40">{fillerChar.repeat(fillerCount)}</span>
        <span>{value}</span>
      </span>
    )
  }

  return (
    <div className="flex h-full flex-shrink-0">
      <div className="flex h-full items-center border-r px-2">{formatValue(direction)}</div>
      <div className="flex h-full items-center border-r px-2">
        {formatValue(magnitude)}
        {unit}
      </div>
    </div>
  )
}
