export const componentsToU = (degrees: number, magnitude: number) => {
  const radians = degrees * (Math.PI / 180)
  return -magnitude * Math.sin(radians)
}
