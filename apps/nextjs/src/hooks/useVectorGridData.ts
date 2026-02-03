import type { IPngMetadataTextualData } from '@lunapaint/png-codec'
import { useCallback, useEffect, useRef, useState } from 'react'
import { decodePng } from '@lunapaint/png-codec'
import ky from 'ky'
import { z } from 'zod'

import type { VectorGridConfig } from '@sctv/shared'

import type { VectorGrid } from './useVectorGrid'

export const vectorGridMetadataSchema = z.object({
  minU: z.string().pipe(z.coerce.number()),
  maxU: z.string().pipe(z.coerce.number()),
  minV: z.string().pipe(z.coerce.number()),
  maxV: z.string().pipe(z.coerce.number()),
})

interface UseVectorGridDataProps {
  date: Date | null
  config: VectorGridConfig
}

// Create a cache to store processed image data
const cache = new Map<string, VectorGrid>()

export const useVectorGridData = ({ date, config }: UseVectorGridDataProps) => {
  const [vectorGrid, setVectorGrid] = useState<VectorGrid | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const latestDate = useRef<Date | null>(date)

  const loadImage = useCallback(
    async (date: Date) => {
      const url = config.url(date)

      // Check if the data for this URL is already in the cache
      const cachedData = cache.get(url)
      if (cachedData) {
        setVectorGrid(cachedData)
        setIsLoading(false)
        return
      }

      try {
        const arrayBuffer = await ky(url, { mode: 'cors' }).arrayBuffer()
        if (date === latestDate.current) {
          const decoded = await decodePng(new Uint8Array(arrayBuffer), { parseChunkTypes: '*', strictMode: true })
          const decodedImage = new ImageData(new Uint8ClampedArray(decoded.image.data.buffer), decoded.image.width, decoded.image.height)
          const decodedMetadata = vectorGridMetadataSchema.parse(
            Object.fromEntries(
              decoded.metadata.filter((item): item is IPngMetadataTextualData => item.type === 'tEXt').map((item) => [item.keyword, item.text]),
            ),
          )
          const newVectorGrid = { image: decodedImage, metadata: decodedMetadata, config }

          // Store the processed data in the cache using the URL as the key
          cache.set(url, newVectorGrid)

          setVectorGrid(newVectorGrid)
          setIsLoading(false)
          setError(null)
        }
      } catch (err) {
        console.error('Error loading image:', err)
        if (date === latestDate.current) {
          setError(new Error('Failed to load image'))
          setIsLoading(false)
        }
      }
    },
    [config],
  )

  useEffect(() => {
    if (date) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching requires synchronous loading state update
      setIsLoading(true)
      void loadImage(date)
    } else {
      setVectorGrid(null)
      setIsLoading(false)
      setError(null)
    }
  }, [date, loadImage])

  useEffect(() => {
    latestDate.current = date
  }, [date])

  return { vectorGrid, isLoading, error }
}
