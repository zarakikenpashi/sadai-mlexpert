import assert from 'node:assert/strict';
import test from 'node:test';

import {
  expectedImportHeaders,
  generateImportTemplateSpec,
  importRowsAsDraftEntries,
  validateImportRows
} from '../lib/import-excel.mjs';

const validRows = [
  { date: '2026-09-16', journal: 'ACH', piece: 'ACH-001', account: '601000', label: 'Achat marchandises', debit: 100000, credit: 0 },
  { date: '2026-09-16', journal: 'ACH', piece: 'ACH-001', account: '401000', label: 'Fournisseur ABC', debit: 0, credit: 100000 }
];

test('strict Excel template exposes the exact expected columns', () => {
  const spec = generateImportTemplateSpec();

  assert.deepEqual(expectedImportHeaders, ['date', 'journal', 'piece', 'account', 'label', 'debit', 'credit']);
  assert.deepEqual(spec.sheets[0].rows[0], expectedImportHeaders);
});

test('valid rows import as draft entries only', () => {
  const result = importRowsAsDraftEntries({ rows: validRows, existingPieces: new Set() });

  assert.equal(result.acceptedEntries.length, 1);
  assert.equal(result.acceptedEntries[0].status, 'draft');
  assert.equal(result.acceptedEntries[0].piece, 'ACH-001');
  assert.equal(result.acceptedEntries[0].totals.difference, 0);
  assert.deepEqual(result.errorReport.errors, []);
});

test('one invalid line rejects the complete related entry', () => {
  const result = validateImportRows({
    rows: [
      ...validRows,
      { date: '2026-09-16', journal: 'ACH', piece: 'ACH-002', account: '', label: 'Compte manquant', debit: 5000, credit: 0 },
      { date: '2026-09-16', journal: 'ACH', piece: 'ACH-002', account: '401000', label: 'Fournisseur', debit: 0, credit: 5000 }
    ],
    existingPieces: new Set()
  });

  assert.equal(result.acceptedEntries.length, 1);
  assert.ok(result.rejectedEntries.some((entry) => entry.piece === 'ACH-002'));
  assert.ok(result.errorReport.errors.some((error) => error.piece === 'ACH-002' && error.code === 'missing-account'));
});

test('unbalanced entry is rejected and not partially imported', () => {
  const result = importRowsAsDraftEntries({
    rows: [
      { date: '2026-09-16', journal: 'ACH', piece: 'ACH-003', account: '601000', label: 'Achat', debit: 100000, credit: 0 },
      { date: '2026-09-16', journal: 'ACH', piece: 'ACH-003', account: '401000', label: 'Fournisseur', debit: 0, credit: 90000 }
    ],
    existingPieces: new Set()
  });

  assert.equal(result.acceptedEntries.length, 0);
  assert.deepEqual(result.rejectedEntries.map((entry) => entry.piece), ['ACH-003']);
  assert.ok(result.errorReport.errors.some((error) => error.code === 'unbalanced-entry'));
});

test('duplicate piece is rejected by company fiscal year journal and piece', () => {
  const result = validateImportRows({
    rows: validRows,
    existingPieces: new Set(['ACH|ACH-001'])
  });

  assert.equal(result.acceptedEntries.length, 0);
  assert.equal(result.rejectedEntries[0].piece, 'ACH-001');
  assert.ok(result.errorReport.errors.some((error) => error.code === 'duplicate-piece'));
});
