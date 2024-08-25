const MISSING_VALUE = '9.999E20'

export const parse = (text: string, variable: string) => {
  const lines = text.split('\n')
  let isCapturing = false
  return lines.reduce((values: number[], line) => {
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
          return trimmed === MISSING_VALUE ? 0 : parseFloat(trimmed)
        })
      return [...values, ...newValues]
    }
    return values
  }, [])
}
