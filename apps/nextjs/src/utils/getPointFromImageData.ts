// Utility function to check if coordinates are within bounds
const checkBounds = (width: number, height: number, x: number, y: number): void => {
  if (x < 0 || x >= width || y < 0 || y >= height) throw new Error('Coordinates out of bounds')
}

// Utility function to calculate RGBA index
const index = (width: number, x: number, y: number): number => {
  return (y * width + x) * 4
}

// Utility function to safely get RGBA values
const getPixel = (data: Uint8ClampedArray, index: number): [number, number, number, number] => {
  const r = data[index]
  const g = data[index + 1]
  const b = data[index + 2]
  const a = data[index + 3]
  if (r === undefined || g === undefined || b === undefined || a === undefined) throw new Error('Pixel data out of bounds')
  return [r, g, b, a]
}

// Cubic interpolation helper
const cubicKernel = (t: number): [number, number, number, number] => {
  const n = [1.0 - t, 2.0 - t, 3.0 - t, 4.0 - t] as const
  const s = n.map((v) => v * v * v) as [number, number, number, number]
  const x = s[0]
  const y = s[1] - 4.0 * s[0]
  const z = s[2] - 4.0 * s[1] + 6.0 * s[0]
  const w = 6.0 - x - y - z
  return [x, y, z, w].map((v) => v * (1.0 / 6.0)) as [number, number, number, number]
}

// Bicubic interpolation function
const bicubicInterpolate = (
  values: [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number],
  x: number,
  y: number,
): number => {
  const [xWeights0, xWeights1, xWeights2, xWeights3] = cubicKernel(x)
  const [yWeights0, yWeights1, yWeights2, yWeights3] = cubicKernel(y)

  // Horizontal interpolation
  const row0 = values[0] * xWeights0 + values[1] * xWeights1 + values[2] * xWeights2 + values[3] * xWeights3
  const row1 = values[4] * xWeights0 + values[5] * xWeights1 + values[6] * xWeights2 + values[7] * xWeights3
  const row2 = values[8] * xWeights0 + values[9] * xWeights1 + values[10] * xWeights2 + values[11] * xWeights3
  const row3 = values[12] * xWeights0 + values[13] * xWeights1 + values[14] * xWeights2 + values[15] * xWeights3

  // Vertical interpolation
  return row0 * yWeights0 + row1 * yWeights1 + row2 * yWeights2 + row3 * yWeights3
}

export const getPointFromImageData = {
  // Get pixel using floor rounding
  floor(imageData: ImageData, x: number, y: number): [number, number, number, number] {
    const { width, height, data } = imageData
    checkBounds(width, height, x, y)
    const xNearest = Math.floor(x)
    const yNearest = Math.floor(y)
    const i = index(width, xNearest, yNearest)
    return getPixel(data, i)
  },

  // Get pixel using nearest neighbor rounding
  nearestNeighbor(imageData: ImageData, x: number, y: number): [number, number, number, number] {
    const { width, height, data } = imageData
    checkBounds(width, height, x, y)
    const xNearest = Math.round(x)
    const yNearest = Math.round(y)
    const i = index(width, xNearest, yNearest)
    return getPixel(data, i)
  },

  // Get pixel using bilinear interpolation
  bilinear(imageData: ImageData, x: number, y: number): [number, number, number, number] {
    const { width, height, data } = imageData
    checkBounds(width, height, x, y)
    const x0 = Math.floor(x)
    const x1 = (x0 + 1) % width // Wrap around horizontally
    const y0 = Math.floor(y)
    const y1 = (y0 + 1) % height // Wrap around vertically

    const iTopLeft = index(width, x0, y0)
    const iTopRight = index(width, x1, y0)
    const iBottomLeft = index(width, x0, y1)
    const iBottomRight = index(width, x1, y1)

    const [rTopLeft, gTopLeft, bTopLeft, aTopLeft] = getPixel(data, iTopLeft)
    const [rTopRight, gTopRight, bTopRight, aTopRight] = getPixel(data, iTopRight)
    const [rBottomLeft, gBottomLeft, bBottomLeft, aBottomLeft] = getPixel(data, iBottomLeft)
    const [rBottomRight, gBottomRight, bBottomRight, aBottomRight] = getPixel(data, iBottomRight)

    const fx = x - x0
    const fy = y - y0
    const interpolate = (tl: number, tr: number, bl: number, br: number): number => {
      const top = tl * (1 - fx) + tr * fx
      const bottom = bl * (1 - fx) + br * fx
      return top * (1 - fy) + bottom * fy
    }

    const r = interpolate(rTopLeft, rTopRight, rBottomLeft, rBottomRight)
    const g = interpolate(gTopLeft, gTopRight, gBottomLeft, gBottomRight)
    const b = interpolate(bTopLeft, bTopRight, bBottomLeft, bBottomRight)
    const a = interpolate(aTopLeft, aTopRight, aBottomLeft, aBottomRight)

    return [r, g, b, a]
  },

  // Get pixel using bicubic interpolation
  bicubic(imageData: ImageData, x: number, y: number): [number, number, number, number] {
    const { width, height, data } = imageData
    checkBounds(width, height, x, y)

    const x0 = Math.floor(x) - 1
    const y0 = Math.floor(y) - 1

    const pixels = (dx: number, dy: number): [number, number, number, number] => {
      const px = (x0 + dx + width) % width // Wrap around horizontally
      const py = (y0 + dy + height) % height // Wrap around vertically
      const i = index(width, px, py)
      return getPixel(data, i)
    }

    const channels = ([0, 1, 2, 3] as const).map((channel) => {
      const values: [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number] = [
        pixels(0, 0)[channel],
        pixels(1, 0)[channel],
        pixels(2, 0)[channel],
        pixels(3, 0)[channel],
        pixels(0, 1)[channel],
        pixels(1, 1)[channel],
        pixels(2, 1)[channel],
        pixels(3, 1)[channel],
        pixels(0, 2)[channel],
        pixels(1, 2)[channel],
        pixels(2, 2)[channel],
        pixels(3, 2)[channel],
        pixels(0, 3)[channel],
        pixels(1, 3)[channel],
        pixels(2, 3)[channel],
        pixels(3, 3)[channel],
      ]

      return bicubicInterpolate(values, x - x0 - 1, y - y0 - 1)
    })

    return channels as [number, number, number, number]
  },
}
