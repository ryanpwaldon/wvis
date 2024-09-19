import { encodePng } from '@lunapaint/png-codec'
import { interpolateRound } from 'd3-interpolate'
import { scaleLinear } from 'd3-scale'

interface GenerateFlowFieldImageProps {
  u: Array<number | null>
  v: Array<number | null>
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

  // Adjust minU and minV to ensure zero maps to an integer in the range.
  const kU = Math.ceil(((0 - minU) / (maxU - minU)) * 255)
  const kV = Math.ceil(((0 - minV) / (maxV - minV)) * 255)
  const adjustedMinU = -((kU * maxU) / (255 - kU))
  const adjustedMinV = -((kV * maxV) / (255 - kV))

  const scaleU = scaleLinear().domain([adjustedMinU, maxU]).range([0, 255]).interpolate(interpolateRound)
  const scaleV = scaleLinear().domain([adjustedMinV, maxV]).range([0, 255]).interpolate(interpolateRound)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const invertedY = height - y - 1 // invert y-axis
      const index = y * width + x
      const uVal = u[index]
      const vVal = v[index]
      if (uVal === undefined || vVal === undefined) throw new Error(`Undefined value encountered at index ${index}`)
      const isMissingValue = uVal === null || vVal === null
      const pixelIndex = (invertedY * width + x) * 4
      imageData[pixelIndex] = scaleU(isMissingValue ? 0 : uVal)
      imageData[pixelIndex + 1] = scaleV(isMissingValue ? 0 : vVal)
      imageData[pixelIndex + 2] = 0
      imageData[pixelIndex + 3] = isMissingValue ? 0 : 255
    }
  }
  const encoded = await encodePng(
    { data: imageData, width, height },
    {
      colorType: 6,
      bitDepth: 8,
      strictMode: true,
      ancillaryChunks: [
        { type: 'tEXt', keyword: 'minU', text: adjustedMinU.toString() },
        { type: 'tEXt', keyword: 'maxU', text: maxU.toString() },
        { type: 'tEXt', keyword: 'minV', text: adjustedMinV.toString() },
        { type: 'tEXt', keyword: 'maxV', text: maxV.toString() },
      ],
    },
  )
  return Buffer.from(encoded.data)
}
