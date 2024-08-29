import { useCallback, useEffect, useRef } from 'react'

type AnyFunction = (...args: never[]) => unknown

export const useThrottledCallback = <T extends AnyFunction>(callback: T, delay: number): ((...args: Parameters<T>) => void) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastRanRef = useRef(0)
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()

      if (lastRanRef.current && now - lastRanRef.current < delay) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(
          () => {
            lastRanRef.current = now
            callbackRef.current(...args)
          },
          delay - (now - lastRanRef.current),
        )
      } else {
        lastRanRef.current = now
        callbackRef.current(...args)
      }
    },
    [delay],
  )
}
