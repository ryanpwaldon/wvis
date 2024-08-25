export const generateSchedule = (startDate: Date, days: number) => {
  const intervalsPerDay = 8 // 3-hour intervals per day (24 / 3 = 8)
  const totalIntervals = days * intervalsPerDay
  const result: [number, Date][] = []
  for (let i = 0; i <= totalIntervals; i++) {
    const date = new Date(startDate.getTime())
    date.setHours(startDate.getHours() + i * 3)
    result.push([i, date])
  }
  return result
}
