export const zip = <T, U>(a: T[], b: U[]): [T, U][] => {
  if (a.length !== b.length) throw new Error('Arrays must be of the same length.')
  return a.map((item, index) => [item, b[index]] as [T, U])
}
