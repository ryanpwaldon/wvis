import { useCallback, useEffect, useRef, useState } from 'react'

export const useVectorGrid = (url: string | null) => {
  const [vectorGridData, setVectorGridData] = useState<ImageData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const latestUrl = useRef<string | null>(url)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    latestUrl.current = url
  }, [url])

  const loadImage = useCallback((url: string) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      if (url === latestUrl.current) {
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d')
          if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
          }
        }

        canvasRef.current = document.createElement('canvas')
        canvasRef.current.width = img.width
        canvasRef.current.height = img.height
        const ctx = canvasRef.current.getContext('2d')

        if (ctx) {
          ctx.drawImage(img, 0, 0)
          const imgData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
          setVectorGridData(imgData)
          setIsLoading(false)
          setError(null)
        } else {
          setError(new Error('Could not get 2D context from canvas'))
          setIsLoading(false)
        }
      }
    }

    img.onerror = () => {
      if (url === latestUrl.current) {
        setError(new Error('Failed to load image'))
        setIsLoading(false)
      }
    }

    img.src = url

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [])

  useEffect(() => {
    if (url) {
      setIsLoading(true)
      const cleanup = loadImage(url)

      return () => {
        cleanup()
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d')
          if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
          }
          canvasRef.current = null
        }
      }
    } else {
      // Reset state when URL is null
      setVectorGridData(null)
      setIsLoading(false)
      setError(null)

      // Clean up any existing canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        }
        canvasRef.current = null
      }
    }
  }, [url, loadImage])

  const queryVectorGrid = useCallback(
    (x: number, y: number) => {
      if (!vectorGridData) return null
      const index = (y * vectorGridData.width + x) * 4
      if (index < 0 || index >= vectorGridData.data.length) return null
      const r = vectorGridData.data[index] ?? null
      const g = vectorGridData.data[index + 1] ?? null
      const b = vectorGridData.data[index + 2] ?? null
      const a = vectorGridData.data[index + 3] ?? null
      if (r === null || g === null || b === null || a === null) return null
      return [r, g, b, a] as const
    },
    [vectorGridData],
  )

  return { vectorGridData, queryVectorGrid, isLoading, error }
}
