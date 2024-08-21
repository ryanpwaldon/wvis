export const generateForecastSchedule = (startDate: Date, resolution: '1h' | '3h', days: number) => {
  const intervals: { hourString: string; dateString: string }[] = []
  const hourlyCoverageLimit = 120 // 5 days
  const maxDays = Math.min(days, 16) // 16 days

  if (resolution === '1h') {
    for (let hour = 0; hour <= maxDays * 24; hour += hour < hourlyCoverageLimit ? 1 : 3) {
      const date = new Date(startDate)
      date.setHours(date.getHours() + hour)
      intervals.push({
        hourString: hour.toString().padStart(3, '0'),
        dateString: date.toISOString(),
      })
    }
  } else {
    for (let hour = 0; hour <= maxDays * 24; hour += 3) {
      const date = new Date(startDate)
      date.setHours(date.getHours() + hour)
      intervals.push({
        hourString: hour.toString().padStart(3, '0'),
        dateString: date.toISOString(),
      })
    }
  }

  return intervals
}
