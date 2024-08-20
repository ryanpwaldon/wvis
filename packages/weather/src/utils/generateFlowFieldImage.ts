import jimp from 'jimp'

const MIN_RANGE = -100
const MAX_RANGE = 100

export const generateFlowFieldImage = async (u: number[], v: number[], width: number, height: number, xOffset: number, outputPath: string) => {
  if (u.length !== width * height || v.length !== width * height) throw new Error("Array size doesn't match the provided dimensions.")

  const image = new jimp(width, height, 0x00000000)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const adjustedX = (x + xOffset) % width
      const index = y * width + x

      const uValue = u[index]
      const vValue = v[index]
      if (uValue === undefined || vValue === undefined) throw new Error(`Undefined value encountered at index ${index}`)

      // Clamp U and V to the min/max range
      const clampedUgrdValue = Math.max(MIN_RANGE, Math.min(MAX_RANGE, uValue))
      const clampedVgrdValue = Math.max(MIN_RANGE, Math.min(MAX_RANGE, vValue))

      // Normalize clamped values to the 0-255 range
      const red = Math.floor(((clampedUgrdValue + 100) / 200) * 255)
      const green = Math.floor(((clampedVgrdValue + 100) / 200) * 255)

      // Combine red and green values into one pixel
      const color = jimp.rgbaToInt(red, green, 0, 255)
      image.setPixelColor(color, adjustedX, y)
    }
  }

  await image.writeAsync(outputPath)
}
