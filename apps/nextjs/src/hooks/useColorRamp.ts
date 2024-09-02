import { useMemo, useRef } from 'react'
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
  const _colorRamp = useRef(new Uint8ClampedArray(size * 4))
  const colorRamp = useMemo(() => {
    for (let i = 0; i < size; i++) {
      const t = i / (size - 1)
      const color = rgb(palettes[palette](t))
      _colorRamp.current[i * 4] = color.r
      _colorRamp.current[i * 4 + 1] = color.g
      _colorRamp.current[i * 4 + 2] = color.b
      _colorRamp.current[i * 4 + 3] = 255
    }
    return _colorRamp.current
  }, [palette])

  return { colorRamp }
}
