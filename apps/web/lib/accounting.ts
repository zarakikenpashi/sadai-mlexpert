export type EntryLine = {
  account: string;
  label: string;
  debit: number;
  credit: number;
};

export function lineIsValid(line: EntryLine): boolean {
  const debit = Number(line.debit || 0);
  const credit = Number(line.credit || 0);
  if (debit < 0 || credit < 0) return false;
  return (debit > 0 && credit === 0) || (credit > 0 && debit === 0);
}

export function totals(lines: EntryLine[]) {
  return lines.reduce(
    (acc, line) => ({ debit: acc.debit + Number(line.debit || 0), credit: acc.credit + Number(line.credit || 0) }),
    { debit: 0, credit: 0 }
  );
}

export function isBalanced(lines: EntryLine[]): boolean {
  if (lines.length < 2) return false;
  if (!lines.every(lineIsValid)) return false;
  const total = totals(lines);
  return total.debit > 0 && total.debit === total.credit;
}

export function canValidateEntry(lines: EntryLine[], fiscalYearClosed: boolean): boolean {
  return !fiscalYearClosed && isBalanced(lines);
}
