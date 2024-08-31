const MISSING_VALUE = '9.999E20'

export const parse = (text: string, variable: string) => {
  const lines = text.split('\n')
  let isCapturing = false
  let min = Infinity
  let max = -Infinity
  const values = lines.reduce((values: number[], line) => {
    if (line.startsWith(variable)) {
      isCapturing = true
      return values
    }
    if (isCapturing && line.trim() === '') {
      isCapturing = false
      return values
    }
    if (isCapturing) {
      const newValues = line
        .split(',')
        .slice(1)
        .map((v) => {
          const trimmed = v.trim()
          if (trimmed === MISSING_VALUE) return 0
          const num = parseFloat(trimmed)
          if (num < min) min = num
          if (num > max) max = num
          return num
        })
      return [...values, ...newValues]
    }
    return values
  }, [])
  return { values, min, max }
}
