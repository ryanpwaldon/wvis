import { interpolateRound } from 'd3-interpolate'
import { scaleLinear } from 'd3-scale'
import Jimp from 'jimp'

interface GenerateFlowFieldImageProps {
  uValues: number[]
  vValues: number[]
  width: number
  height: number
  magnitude: number
}

export const generateFlowFieldImage = async ({ uValues, vValues, width, height, magnitude }: GenerateFlowFieldImageProps): Promise<Buffer> => {
  if (uValues.length !== width * height || vValues.length !== width * height) throw new Error("Array size doesn't match the provided dimensions.")
  const image = new Jimp(width, height, 0x00000000)
  const minMagnitude = magnitude * -1
  const maxMagnitude = magnitude
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const invertedY = height - y - 1 // invert y-axis
      const index = y * width + x
      const u = uValues[index]
      const v = vValues[index]
      if (u === undefined || v === undefined) throw new Error(`Undefined value encountered at index ${index}`)
      const scale = scaleLinear().domain([minMagnitude, maxMagnitude]).range([0, 255]).clamp(true).interpolate(interpolateRound)
      const red = scale(u)
      const green = scale(v)
      const color = Jimp.rgbaToInt(red, green, 0, 255)
      image.setPixelColor(color, x, invertedY)
    }
  }
  return await image.getBufferAsync(Jimp.MIME_PNG)
}
