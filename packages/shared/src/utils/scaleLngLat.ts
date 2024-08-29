const LNG_MIN = -180
const LNG_MAX = 180
const LAT_MIN = -90
const LAT_MAX = 90

export const scaleLngLat = (lngLat: [number, number], lngRange: [number, number], latRange: [number, number]) => {
  const lng = lngLat[0]
  const lat = lngLat[1]
  let scaledLng = ((lng - LNG_MIN) * (lngRange[1] - lngRange[0])) / (LNG_MAX - LNG_MIN) + lngRange[0]
  scaledLng = scaledLng % lngRange[1]
  let scaledLat = ((lat - LAT_MIN) * (latRange[1] - latRange[0])) / (LAT_MAX - LAT_MIN) + latRange[0]
  scaledLat = scaledLat % latRange[1]
  return [scaledLng, scaledLat] as const
}
