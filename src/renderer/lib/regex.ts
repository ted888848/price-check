const decimalPattern = /\d+(?:\.\d+)?/
const numberPattern = new RegExp(`[+-]?(${decimalPattern.source})(?:\\(${decimalPattern.source}-${decimalPattern.source}\\))?`, 'g')
export function getStrReg(section: string[], type: string) {
  const retArr: RegExp[] = []
  section.forEach(line => {
    const indexOfType = line.indexOf(` (${type})`)
    line = indexOfType > -1 ? line.substring(0, indexOfType) : line
    line = line.replace(numberPattern, '__NUMBER__')
    line = line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    line = line.replace(' — 無法使用的值', '')
    retArr.push(new RegExp(`^${line.replace(/__NUMBER__/g, "[+-]?(\\d+|#)(?:\\(\\d+-\\d+\\))?")
      .replace(/減少|增加/, "(?:減少|增加)")}( \\(部分\\))?$`))
  })
  return retArr
}

export function getModMatchRegex(modLine: string) {
  return new RegExp(modLine.replace(/[+-]?#/g, numberPattern.source)
    .replace(' (部分)', '').replace(/減少|增加/, String.raw`(?:減少|增加)`))
}