import type { IPngMetadataTextualData } from '@lunapaint/png-codec'
import { useCallback, useEffect, useRef, useState } from 'react'
import { decodePng } from '@lunapaint/png-codec'
import ky from 'ky'
import { z } from 'zod'

const vectorGridMetadataSchema = z.object({
  minU: z.string().pipe(z.coerce.number()),
  maxU: z.string().pipe(z.coerce.number()),
  minV: z.string().pipe(z.coerce.number()),
  maxV: z.string().pipe(z.coerce.number()),
})

export interface VectorGrid {
  image: ImageData
  metadata: z.infer<typeof vectorGridMetadataSchema>
}

export const useImageData = (url: string | null) => {
  const [vectorGrid, setVectorGrid] = useState<VectorGrid | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const latestUrl = useRef<string | null>(url)

  const loadImage = useCallback(async (url: string) => {
    try {
      const arrayBuffer = await ky(url, { mode: 'cors' }).arrayBuffer()
      const decoded = await decodePng(new Uint8Array(arrayBuffer), { parseChunkTypes: '*', strictMode: true })
      if (url === latestUrl.current) {
        const decodedImage = new ImageData(new Uint8ClampedArray(decoded.image.data.buffer), decoded.image.width, decoded.image.height)
        const decodedMetadata = vectorGridMetadataSchema.parse(Object.fromEntries(decoded.metadata.filter((item): item is IPngMetadataTextualData => item.type === 'tEXt').map((item) => [item.keyword, item.text]))) // prettier-ignore
        setVectorGrid({ image: decodedImage, metadata: decodedMetadata })
        setIsLoading(false)
        setError(null)
      }
    } catch (err) {
      console.error('Error loading image:', err)
      if (url === latestUrl.current) {
        setError(new Error('Failed to load image'))
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (url) {
      setIsLoading(true)
      void loadImage(url)
    } else {
      setVectorGrid(null)
      setIsLoading(false)
      setError(null)
    }
  }, [url, loadImage])

  useEffect(() => void (latestUrl.current = url), [url])

  return { vectorGrid, isLoading, error }
}
