export const componentsToV = (degrees: number | null, magnitude: number | null) => {
  if (degrees === null || magnitude === null) return null
  const radians = degrees * (Math.PI / 180)
  return -magnitude * Math.cos(radians)
}
