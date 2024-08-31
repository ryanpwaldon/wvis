import { interpolateRound } from 'd3-interpolate'
import { scaleLinear } from 'd3-scale'
import Jimp from 'jimp'
import mp from 'meta-png'

interface GenerateFlowFieldImageProps {
  u: number[]
  v: number[]
  minU: number
  maxU: number
  minV: number
  maxV: number
  width: number
  height: number
}

export const generateFlowFieldImage = async ({ u, v, minU, maxU, minV, maxV, width, height }: GenerateFlowFieldImageProps): Promise<Buffer> => {
  if (u.length !== width * height || v.length !== width * height) throw new Error("Array size doesn't match the provided dimensions.")
  const image = new Jimp(width, height, 0x00000000)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const invertedY = height - y - 1 // invert y-axis
      const index = y * width + x
      const uVal = u[index]
      const vVal = v[index]
      if (uVal === undefined || vVal === undefined) throw new Error(`Undefined value encountered at index ${index}`)
      const scaleU = scaleLinear().domain([minU, maxU]).range([0, 255]).clamp(true).interpolate(interpolateRound)
      const scaleV = scaleLinear().domain([minV, maxV]).range([0, 255]).clamp(true).interpolate(interpolateRound)
      const red = scaleU(uVal)
      const green = scaleV(vVal)
      const color = Jimp.rgbaToInt(red, green, 0, 255)
      image.setPixelColor(color, x, invertedY)
    }
  }
  let buffer = await image.getBufferAsync(Jimp.MIME_PNG)
  let uint8 = new Uint8Array(buffer)
  uint8 = mp.addMetadata(uint8, 'minU', minU.toString())
  uint8 = mp.addMetadata(uint8, 'maxU', maxU.toString())
  uint8 = mp.addMetadata(uint8, 'minV', minV.toString())
  uint8 = mp.addMetadata(uint8, 'maxV', maxV.toString())
  buffer = Buffer.from(uint8)
  return buffer
}
