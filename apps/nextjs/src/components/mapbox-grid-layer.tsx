'use client'

import { useEffect, useRef } from 'react'

import { useMapbox } from '~/hooks/useMapbox'

export const MapboxGridLayer = () => {
  const map = useMapbox()
  const sourceRef = useRef<string | null>(null)

  useEffect(() => {
    const sourceId = 'grid'
    const lineLayerId = 'grid-lines'
    const labelLayerId = 'grid-labels'

    const createGridLines = () => {
      const lines: GeoJSON.Feature<GeoJSON.LineString>[] = []
      for (let lat = -90; lat <= 90; lat += 0.25) {
        lines.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [-180, lat],
              [180, lat],
            ],
          },
          properties: { latitude: lat },
        })
      }
      for (let lon = -180; lon <= 180; lon += 0.25) {
        lines.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [lon, -90],
              [lon, 90],
            ],
          },
          properties: { longitude: lon },
        })
      }
      return lines
    }

    // Add source and layers
    const addGridToMap = () => {
      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: createGridLines(),
        },
      })

      map.addLayer({
        id: lineLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#888',
          'line-width': 1,
          'line-opacity': 0.6,
        },
      })

      map.addLayer({
        id: labelLayerId,
        type: 'symbol',
        source: sourceId,
        layout: {
          'text-field': [
            'concat',
            ['case', ['has', 'latitude'], ['abs', ['get', 'latitude']], ['abs', ['get', 'longitude']]],
            '°',
            ['case', ['has', 'latitude'], ['case', ['>', ['get', 'latitude'], 0], 'N', 'S'], ['case', ['>', ['get', 'longitude'], 0], 'E', 'W']],
          ],
          'text-font': ['Martian Mono Regular'],
          'text-size': 12,
          'text-allow-overlap': false,
          'symbol-placement': 'line-center',
        },
        paint: {
          'text-color': '#000',
          'text-halo-color': 'rgba(255, 255, 255, 0.8)',
          'text-halo-width': 1.5,
        },
      })

      sourceRef.current = sourceId
    }

    addGridToMap()

    return () => {
      if (map.getLayer(labelLayerId)) map.removeLayer(labelLayerId)
      if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId)
      if (map.getSource(sourceId)) map.removeSource(sourceId)
      sourceRef.current = null
    }
  }, [map])

  return null
}
