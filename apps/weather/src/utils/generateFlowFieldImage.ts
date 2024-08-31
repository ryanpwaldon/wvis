import { encodePng } from '@lunapaint/png-codec'
import { interpolateRound } from 'd3-interpolate'
import { scaleLinear } from 'd3-scale'

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
  const imageData = new Uint8Array(width * height * 4)
  const scaleU = scaleLinear().domain([minU, maxU]).range([0, 255]).interpolate(interpolateRound)
  const scaleV = scaleLinear().domain([minV, maxV]).range([0, 255]).interpolate(interpolateRound)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const invertedY = height - y - 1 // invert y-axis
      const index = y * width + x
      const uVal = u[index]
      const vVal = v[index]
      if (uVal === undefined || vVal === undefined) throw new Error(`Undefined value encountered at index ${index}`)
      const red = scaleU(uVal)
      const green = scaleV(vVal)
      const pixelIndex = (invertedY * width + x) * 4
      imageData[pixelIndex] = red
      imageData[pixelIndex + 1] = green
      imageData[pixelIndex + 2] = 0
      imageData[pixelIndex + 3] = 255
    }
  }
  const encoded = await encodePng(
    { data: imageData, width, height },
    {
      colorType: 6,
      bitDepth: 8,
      strictMode: true,
      ancillaryChunks: [
        { type: 'tEXt', keyword: 'minU', text: minU.toString() },
        { type: 'tEXt', keyword: 'maxU', text: maxU.toString() },
        { type: 'tEXt', keyword: 'minV', text: minV.toString() },
        { type: 'tEXt', keyword: 'maxV', text: maxV.toString() },
      ],
    },
  )
  return Buffer.from(encoded.data)
}
