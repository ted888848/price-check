const decimalPattern = /[+-]?\d+(?:\.\d+)?/;
const numberPattern = new RegExp(`(${decimalPattern.source}(?:\\(${decimalPattern.source}-${decimalPattern.source}\\))?)`, "g");
export const numberPatternWithNameGroup = new RegExp(
  `(?<value>${decimalPattern.source})(?:\\((?<lowerBound>${decimalPattern.source})-(?<upperBound>${decimalPattern.source})\\))?`,
);
export const hasPossibilityReg = /(有 \+?#% 機率)/;
export const diffSignReg = /(增加|減少|更多|更少)/;
export function getStrReg(section: string[], type: string) {
  const retArr: RegExp[] = [];
  section.forEach((line) => {
    const indexOfType = line.indexOf(` (${type})`);
    line = indexOfType > -1 ? line.substring(0, indexOfType) : line;
    line = line
      .replace(numberPattern, "__NUMBER__")
      .replaceAll(/​/g, "")
      .replace(/\(\.\.\.\)/, "")
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(" — 無法使用的值", "")
      .replace(/((?:（|\()(.+?-.+?)(?:）|\)))/, "($1)?")
      .replace(/幸運|不幸/, "(?:幸運|不幸)")
      .replace(/__NUMBER__/g, "[+-]?(\\d+|#)(?:\\(-?\\d+--?\\d+\\))?")
      .replace(/增加|減少/, "(?:增加|減少)")
      .replace(/更多|更少/, "(?:更多|更少)");
    retArr.push(new RegExp(`^${line}( \\(.+\\))?$`));
  });
  return retArr;
}

export function getModMatchRegex(modLine: string) {
  return new RegExp(
    modLine
      .replace(/ \(.+\)$/, "")
      .replace(/[+-]?#/g, numberPattern.source)
      .replace(/增加|減少/, String.raw`(?:增加|減少)`)
      .replace(/更多|更少/, String.raw`(?:更多|更少)`),
  );
}
