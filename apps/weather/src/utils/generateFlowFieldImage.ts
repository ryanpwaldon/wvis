import jimp from 'jimp'

interface GenerateFlowFieldImageProps {
  uValues: number[]
  vValues: number[]
  width: number
  height: number
  minMagnitude: number
  maxMagnitude: number
  xOffset: number
}

export const generateFlowFieldImage = async ({
  uValues,
  vValues,
  width,
  height,
  minMagnitude,
  maxMagnitude,
  xOffset,
}: GenerateFlowFieldImageProps): Promise<Buffer> => {
  if (uValues.length !== width * height || vValues.length !== width * height) throw new Error("Array size doesn't match the provided dimensions.")
  const image = new jimp(width, height, 0x00000000)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const adjustedX = (x + xOffset) % width // align start with intl date line
      const adjustedY = height - y - 1 // invert y-axis
      const index = y * width + x
      const u = uValues[index]
      const v = vValues[index]
      if (u === undefined || v === undefined) throw new Error(`Undefined value encountered at index ${index}`)
      // Clamp U and V to the min/max range
      const clampedUgrdValue = Math.max(minMagnitude, Math.min(maxMagnitude, u))
      const clampedVgrdValue = Math.max(minMagnitude, Math.min(maxMagnitude, v))
      // Normalize clamped values to the 0-255 range
      const red = Math.floor(((clampedUgrdValue + 100) / 200) * 255)
      const green = Math.floor(((clampedVgrdValue + 100) / 200) * 255)
      // Combine red and green values into one pixel
      const color = jimp.rgbaToInt(red, green, 0, 255)
      image.setPixelColor(color, adjustedX, adjustedY)
    }
  }
  return await image.getBufferAsync(jimp.MIME_PNG)
}
