type SpeedUnit = 'mps' | 'kph' | 'mph' | 'fps' | 'kts'
type DistanceUnit = 'm' | 'ft'
export type Unit = SpeedUnit | DistanceUnit

const conversionFactors: Record<Unit, number> = {
  mps: 1, // meters per second
  kph: 3.6, // kilometers per hour
  mph: 2.23694, // miles per hour
  fps: 3.28084, // feet per second
  kts: 1.94384, // kts (nautical miles per hour)
  m: 1, // base unit for distance
  ft: 3.28084, // feet per meter
}

export const convertUnit = (value: number, fromUnit: Unit, toUnit: Unit): number => {
  // Check if both units are of the same type (either both speed or both distance)
  const isSpeedConversion = (unit: Unit): unit is SpeedUnit => ['mps', 'kph', 'mph', 'fps', 'kts'].includes(unit)
  const isDistanceConversion = (unit: Unit): unit is DistanceUnit => ['m', 'ft'].includes(unit)

  if ((isSpeedConversion(fromUnit) && isSpeedConversion(toUnit)) || (isDistanceConversion(fromUnit) && isDistanceConversion(toUnit))) {
    const baseValue = value / conversionFactors[fromUnit]
    return baseValue * conversionFactors[toUnit]
  } else {
    return 0
  }
}
