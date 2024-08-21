export const generateModelForecastHourArray = (resolution: '1h' | '3h', days: number) => {
  const intervals: string[] = []
  const hourlyCoverageLimit = 120 // 5 days
  const maxDays = Math.min(days, 16) // 16 days
  if (resolution === '1h') {
    for (let hour = 0; hour <= maxDays * 24; hour += hour < hourlyCoverageLimit ? 1 : 3) {
      intervals.push(hour.toString().padStart(3, '0'))
    }
  } else {
    for (let hour = 0; hour <= maxDays * 24; hour += 3) {
      intervals.push(hour.toString().padStart(3, '0'))
    }
  }
  return intervals
}
