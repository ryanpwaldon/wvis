export const componentsToU = (degrees: number | null, magnitude: number | null) => {
  if (degrees === null || magnitude === null) return 0
  const radians = degrees * (Math.PI / 180)
  return -magnitude * Math.sin(radians)
}