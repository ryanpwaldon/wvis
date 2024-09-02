type DistanceUnit = 'meters' | 'feet'

export const convertDistance = (value: number, fromUnit: DistanceUnit, toUnit: DistanceUnit) => {
  const conversionFactors: Record<DistanceUnit, number> = {
    meters: 1, // base unit
    feet: 3.28084, // feet per meter
  }
  const valueInMeters = value / conversionFactors[fromUnit] // Convert the value to meters
  const convertedValue = valueInMeters * conversionFactors[toUnit] // Convert the value from meters to the desired unit
  return convertedValue
}
