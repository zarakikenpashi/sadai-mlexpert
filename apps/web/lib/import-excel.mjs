import { createDraftEntry, isBalanced } from './accounting.mjs';

export const expectedImportHeaders = ['date', 'journal', 'piece', 'account', 'label', 'debit', 'credit'];

export function generateImportTemplateSpec() {
  return {
    sheets: [
      {
        name: 'Import MLexpert',
        rows: [expectedImportHeaders, ['2026-09-16', 'ACH', 'ACH-2026-0001', '601000', 'Achat marchandises', 100000, 0]],
        freeze_panes: 'A2',
        autofilter: 'A1:G1'
      }
    ]
  };
}

function normalizeRow(row, index) {
  return {
    rowNumber: index + 2,
    date: row.date,
    journal: String(row.journal ?? '').trim(),
    piece: String(row.piece ?? '').trim(),
    account: String(row.account ?? '').trim(),
    label: String(row.label ?? '').trim(),
    debit: Number(row.debit || 0),
    credit: Number(row.credit || 0)
  };
}

function error(piece, rowNumber, code, message) {
  return { piece, rowNumber, code, message };
}

export function validateImportRows({ rows, existingPieces = new Set() }) {
  const normalizedRows = rows.map(normalizeRow);
  const grouped = new Map();
  const errors = [];

  for (const row of normalizedRows) {
    if (!row.journal) errors.push(error(row.piece, row.rowNumber, 'missing-journal', 'Journal obligatoire'));
    if (!row.piece) errors.push(error(row.piece, row.rowNumber, 'missing-piece', 'Pièce obligatoire'));
    if (!row.account) errors.push(error(row.piece, row.rowNumber, 'missing-account', 'Compte obligatoire'));
    if (!row.label) errors.push(error(row.piece, row.rowNumber, 'missing-label', 'Libellé obligatoire'));
    if ((row.debit > 0 && row.credit > 0) || (row.debit === 0 && row.credit === 0)) errors.push(error(row.piece, row.rowNumber, 'invalid-amounts', 'Une ligne doit avoir un débit ou un crédit'));

    const key = `${row.journal}|${row.piece}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }

  const acceptedEntries = [];
  const rejectedEntries = [];

  for (const [key, entryRows] of grouped.entries()) {
    const [journal, piece] = key.split('|');
    const entryErrors = errors.filter((entryError) => entryError.piece === piece);
    if (existingPieces.has(key)) entryErrors.push(error(piece, entryRows[0].rowNumber, 'duplicate-piece', 'Pièce déjà importée pour ce journal'));

    const lines = entryRows.map((row) => ({ account: row.account, label: row.label, debit: row.debit, credit: row.credit }));
    if (entryErrors.length === 0 && !isBalanced(lines)) entryErrors.push(error(piece, entryRows[0].rowNumber, 'unbalanced-entry', 'Écriture déséquilibrée'));

    if (entryErrors.length > 0) {
      rejectedEntries.push({ journal, piece, rows: entryRows, errors: entryErrors });
      continue;
    }

    acceptedEntries.push({
      ...createDraftEntry({ id: piece, label: entryRows[0].label, lines }),
      journal,
      piece,
      date: entryRows[0].date
    });
  }

  const rejectedErrors = rejectedEntries.flatMap((entry) => entry.errors);
  return {
    acceptedEntries,
    rejectedEntries,
    errorReport: {
      totalRows: normalizedRows.length,
      acceptedEntries: acceptedEntries.length,
      rejectedEntries: rejectedEntries.length,
      errors: rejectedErrors
    }
  };
}

export function importRowsAsDraftEntries(input) {
  return validateImportRows(input);
}
