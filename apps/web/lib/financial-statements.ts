export type StateEntryLine = {
  account: string;
  label: string;
  debit: number;
  credit: number;
};

export type StateEntry = {
  id: string;
  status: 'draft' | 'validated' | 'reversed';
  journal: string;
  date: string;
  lines: StateEntryLine[];
};

export type ExportMetadata = {
  cabinet: string;
  company: string;
  fiscalYear: number;
  period: string;
  generatedAt: string;
};

function official(entries: StateEntry[]) {
  return entries.filter((entry) => entry.status === 'validated' || entry.status === 'reversed');
}

function withinPeriod(entry: StateEntry, start?: string, end?: string) {
  if (start && entry.date < start) return false;
  if (end && entry.date > end) return false;
  return true;
}

export function filterStateEntries({ entries, periodStart, periodEnd, journal, accountClass }: { entries: StateEntry[]; periodStart?: string; periodEnd?: string; journal?: string; accountClass?: string }) {
  return official(entries)
    .filter((entry) => withinPeriod(entry, periodStart, periodEnd))
    .filter((entry) => !journal || entry.journal === journal)
    .map((entry) => ({
      ...entry,
      lines: accountClass ? entry.lines.filter((line) => String(line.account).startsWith(String(accountClass))) : entry.lines
    }))
    .filter((entry) => entry.lines.length > 0);
}

export function buildGeneralBalance({ entries }: { entries: StateEntry[] }) {
  const byAccount = new Map<string, { account: string; label: string; debit: number; credit: number; balance: number }>();
  for (const entry of official(entries)) {
    for (const line of entry.lines) {
      const current = byAccount.get(line.account) ?? { account: line.account, label: line.label, debit: 0, credit: 0, balance: 0 };
      current.debit += Number(line.debit || 0);
      current.credit += Number(line.credit || 0);
      current.balance = current.debit - current.credit;
      byAccount.set(line.account, current);
    }
  }
  const rows = [...byAccount.values()].sort((a, b) => a.account.localeCompare(b.account));
  const totals = rows.reduce(
    (acc, row) => ({ debit: acc.debit + row.debit, credit: acc.credit + row.credit, difference: acc.difference + row.balance }),
    { debit: 0, credit: 0, difference: 0 }
  );
  return { rows, totals };
}

export function buildGeneralLedger({ entries }: { entries: StateEntry[] }) {
  const ledger: Record<string, { account: string; label: string; movements: { entryId: string; date: string; journal: string; label: string; debit: number; credit: number; balance: number }[]; closingBalance: number }> = {};
  for (const entry of official(entries).sort((a, b) => a.date.localeCompare(b.date))) {
    for (const line of entry.lines) {
      ledger[line.account] ??= { account: line.account, label: line.label, movements: [], closingBalance: 0 };
      const movementBalance = Number(line.debit || 0) - Number(line.credit || 0);
      ledger[line.account].closingBalance += movementBalance;
      ledger[line.account].movements.push({ entryId: entry.id, date: entry.date, journal: entry.journal, label: line.label, debit: line.debit, credit: line.credit, balance: ledger[line.account].closingBalance });
    }
  }
  return ledger;
}

export function buildExportMetadata(metadata: ExportMetadata) {
  return { ...metadata };
}

export function canExportStates({ permissions }: { permissions: string[] }) {
  return permissions.includes('state:read') && permissions.includes('export:create');
}

export function generateStateExportPayloads({ entries, metadata }: { entries: StateEntry[]; metadata: ExportMetadata }) {
  const balance = buildGeneralBalance({ entries });
  const ledger = buildGeneralLedger({ entries });
  const balanceRows = balance.rows.map((row) => [row.account, row.label, row.debit, row.credit, row.balance]);
  const htmlRows = balance.rows.map((row) => `<tr><td>${row.account}</td><td>${row.label}</td><td>${row.debit}</td><td>${row.credit}</td><td>${row.balance}</td></tr>`).join('');

  return {
    excel: {
      metadata,
      workbook: {
        sheets: [
          { name: 'Balance générale', rows: [['Compte', 'Libellé', 'Débit', 'Crédit', 'Solde'], ...balanceRows] },
          { name: 'Grand livre', rows: [['Compte', 'Date', 'Journal', 'Libellé', 'Débit', 'Crédit', 'Solde'], ...Object.values(ledger).flatMap((account) => account.movements.map((movement) => [account.account, movement.date, movement.journal, movement.label, movement.debit, movement.credit, movement.balance]))] }
        ]
      }
    },
    pdf: {
      metadata,
      html: `<article><h1>Balance générale</h1><p>${metadata.cabinet} — ${metadata.company} — ${metadata.fiscalYear} — ${metadata.period} — ${metadata.generatedAt}</p><table>${htmlRows}</table></article>`
    }
  };
}
