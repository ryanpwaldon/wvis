import Jimp from 'jimp'

interface GenerateFlowFieldImageProps {
  uValues: number[]
  vValues: number[]
  width: number
  height: number
  minMagnitude: number
  maxMagnitude: number
}

export const generateFlowFieldImage = async ({ uValues, vValues, width, height, minMagnitude, maxMagnitude }: GenerateFlowFieldImageProps): Promise<Buffer> => {
  if (uValues.length !== width * height || vValues.length !== width * height) throw new Error("Array size doesn't match the provided dimensions.")
  if (minMagnitude >= maxMagnitude) throw new Error('minMagnitude must be less than maxMagnitude.')
  const image = new Jimp(width, height, 0x00000000)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const adjustedY = height - y - 1 // invert y-axis
      const index = y * width + x
      const u = uValues[index]
      const v = vValues[index]
      if (u === undefined || v === undefined) throw new Error(`Undefined value encountered at index ${index}`)
      // Clamp U and V to the min/max range
      const clampedU = Math.max(minMagnitude, Math.min(maxMagnitude, u))
      const clampedV = Math.max(minMagnitude, Math.min(maxMagnitude, v))
      // Normalize clamped values based on the min/max range provided
      const red = Math.floor(((clampedU - minMagnitude) / (maxMagnitude - minMagnitude)) * 255)
      const green = Math.floor(((clampedV - minMagnitude) / (maxMagnitude - minMagnitude)) * 255)
      // Combine red and green values into one pixel
      const color = Jimp.rgbaToInt(red, green, 0, 255)
      image.setPixelColor(color, x, adjustedY)
    }
  }
  return await image.getBufferAsync(Jimp.MIME_PNG)
}
