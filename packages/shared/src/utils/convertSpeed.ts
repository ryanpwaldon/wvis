type SpeedUnit = 'mps' | 'kph' | 'mph' | 'fps'

export const convertSpeed = (value: number, fromUnit: SpeedUnit, toUnit: SpeedUnit) => {
  const conversionFactors: Record<SpeedUnit, number> = {
    mps: 1, // meters per second
    kph: 3.6, // kilometers per hour
    mph: 2.23694, // miles per hour
    fps: 3.28084, // feet per second
  }
  const valueInMps = value / conversionFactors[fromUnit] // Convert the value to meters per second
  const convertedValue = valueInMps * conversionFactors[toUnit] // Convert the value from meters per second to the desired unit
  return convertedValue
}
