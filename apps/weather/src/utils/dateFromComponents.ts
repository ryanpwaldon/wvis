export const createDateFromComponents = (dateString: string, hour: string) => {
  const year = dateString.slice(0, 4)
  const month = dateString.slice(4, 6)
  const day = dateString.slice(6, 8)
  return new Date(`${year}-${month}-${day}T${hour}:00:00Z`)
}
