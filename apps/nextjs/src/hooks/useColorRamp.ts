import { useMemo } from 'react'
import { rgb } from 'd3-color'
import { interpolateCividis, interpolateTurbo } from 'd3-scale-chromatic'

const size = 256
const palettes = {
  turbo: interpolateTurbo,
  cividis: interpolateCividis,
}

interface UseColorRampProps {
  palette: keyof typeof palettes
}

export const useColorRamp = ({ palette }: UseColorRampProps) => {
  const colorRamp = useMemo(() => {
    const ramp = new Uint8ClampedArray(size * 4)
    for (let i = 0; i < size; i++) {
      const t = i / (size - 1)
      const color = rgb(palettes[palette](t))
      ramp[i * 4] = color.r
      ramp[i * 4 + 1] = color.g
      ramp[i * 4 + 2] = color.b
      ramp[i * 4 + 3] = 255
    }
    return ramp
  }, [palette])

  return { colorRamp }
}
