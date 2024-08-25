export const dateFromParts = (dateStr: string, hourStr: string) => {
  const year = dateStr.slice(0, 4)
  const month = dateStr.slice(4, 6)
  const day = dateStr.slice(6, 8)
  return new Date(`${year}-${month}-${day}T${hourStr}:00:00Z`)
}
