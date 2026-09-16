export function lineIsValid(line) {
  const debit = Number(line.debit || 0);
  const credit = Number(line.credit || 0);
  if (debit < 0 || credit < 0) return false;
  return (debit > 0 && credit === 0) || (credit > 0 && debit === 0);
}

export function totals(lines) {
  const total = lines.reduce(
    (acc, line) => ({ debit: acc.debit + Number(line.debit || 0), credit: acc.credit + Number(line.credit || 0) }),
    { debit: 0, credit: 0 }
  );
  return { ...total, difference: total.debit - total.credit };
}

export function isBalanced(lines) {
  if (lines.length < 2) return false;
  if (!lines.every(lineIsValid)) return false;
  const total = totals(lines);
  return total.debit > 0 && total.difference === 0;
}

export function canValidateEntry(lines, fiscalYearClosed) {
  return !fiscalYearClosed && isBalanced(lines);
}

export function createDraftEntry({ id, lines, label, createdAt = new Date() }) {
  return {
    id,
    label,
    lines,
    status: 'draft',
    immutable: false,
    totals: totals(lines),
    createdAt
  };
}

export function updateDraftEntry({ entry, lines }) {
  if (entry.status === 'validated' || entry.immutable) throw new Error('validated entries are immutable');
  return { ...entry, lines, totals: totals(lines) };
}

export function validateEntry({ entry, validatedAt = new Date() }) {
  if (!isBalanced(entry.lines)) throw new Error('entry is not balanced');
  return {
    ...entry,
    status: 'validated',
    immutable: true,
    validatedAt,
    totals: totals(entry.lines)
  };
}

export function createReversalEntry({ entry, id, createdAt = new Date() }) {
  if (entry.status !== 'validated') throw new Error('only validated entries can be reversed');
  const reversal = createDraftEntry({
    id,
    label: `Contrepassation — ${entry.label}`,
    createdAt,
    lines: entry.lines.map((line) => ({
      ...line,
      debit: Number(line.credit || 0),
      credit: Number(line.debit || 0)
    }))
  });
  return { ...reversal, reversalOfEntryId: entry.id };
}

export function filterOfficialEntries(entries) {
  return entries.filter((entry) => entry.status === 'validated' || entry.status === 'reversed');
}
