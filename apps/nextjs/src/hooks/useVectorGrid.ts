import { useCallback } from 'react'

import type { VectorGrid } from '@sctv/shared'
import { scaleLngLat } from '@sctv/shared'

import { useImageData } from './useImageData'

export const useVectorGrid = (url: string | null, vectorGrid: VectorGrid) => {
  const { imageData: vectorGridData } = useImageData(url)

  const queryVectorGrid = useCallback(
    (lngLat: [number, number] | null) => {
      if (!lngLat) return null
      if (!vectorGridData) return null
      const [x, y] = scaleLngLat(lngLat, [0, vectorGridData.width], [0, vectorGridData.height])
      const rgba = bilinearInterpolation(vectorGridData, x, y)
      return vectorGrid.decode(rgba)
    },
    [vectorGrid, vectorGridData],
  )

  return { vectorGridData, queryVectorGrid }
}

function bilinearInterpolation(imageData: ImageData, x: number, y: number) {
  const { width, height, data } = imageData

  if (x < 0 || x >= width || y < 0 || y >= height) throw new Error('Coordinates out of bounds')

  // Calculate integer pixel coordinates with wrapping
  const x0 = Math.floor(x)
  const x1 = (x0 + 1) % width // Wrap around horizontally
  const y0 = Math.floor(y)
  const y1 = (y0 + 1) % height // Wrap around vertically

  // RGBA index function
  const index = (x: number, y: number): number => (y * width + x) * 4

  // Helper function to safely get RGBA values
  const getPixel = (x: number, y: number): [number, number, number, number] => {
    const i = index(x, y)
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]
    if (r === undefined || g === undefined || b === undefined || a === undefined) throw new Error('Pixel data out of bounds')
    return [r, g, b, a]
  }

  // Get pixel values
  const [rTopLeft, gTopLeft, bTopLeft, aTopLeft] = getPixel(x0, y0)
  const [rTopRight, gTopRight, bTopRight, aTopRight] = getPixel(x1, y0)
  const [rBottomLeft, gBottomLeft, bBottomLeft, aBottomLeft] = getPixel(x0, y1)
  const [rBottomRight, gBottomRight, bBottomRight, aBottomRight] = getPixel(x1, y1)

  // Calculate interpolation weights
  const fx = x - x0
  const fy = y - y0

  // Perform bilinear interpolation for each channel
  const interpolate = (tl: number, tr: number, bl: number, br: number): number => {
    const top = tl * (1 - fx) + tr * fx
    const bottom = bl * (1 - fx) + br * fx
    return top * (1 - fy) + bottom * fy
  }

  const r = interpolate(rTopLeft, rTopRight, rBottomLeft, rBottomRight)
  const g = interpolate(gTopLeft, gTopRight, gBottomLeft, gBottomRight)
  const b = interpolate(bTopLeft, bTopRight, bBottomLeft, bBottomRight)
  const a = interpolate(aTopLeft, aTopRight, aBottomLeft, aBottomRight)

  return [r, g, b, a] as [number, number, number, number]
}
