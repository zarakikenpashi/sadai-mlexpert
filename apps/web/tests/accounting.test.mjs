import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canValidateEntry,
  createDraftEntry,
  createReversalEntry,
  filterOfficialEntries,
  isBalanced,
  lineIsValid,
  updateDraftEntry,
  validateEntry
} from '../lib/accounting.mjs';

const balancedLines = [
  { account: '601000', label: 'Achat', debit: 100000, credit: 0 },
  { account: '401000', label: 'Fournisseur', debit: 0, credit: 100000 }
];

const unbalancedLines = [
  { account: '601000', label: 'Achat', debit: 100000, credit: 0 },
  { account: '401000', label: 'Fournisseur', debit: 0, credit: 90000 }
];

test('balanced entry can be validated', () => {
  assert.equal(isBalanced(balancedLines), true);
  assert.equal(canValidateEntry(balancedLines, false), true);
});

test('unbalanced entry is rejected', () => {
  assert.equal(isBalanced(unbalancedLines), false);
  assert.equal(canValidateEntry(unbalancedLines, false), false);
});

test('line cannot contain debit and credit together', () => {
  assert.equal(lineIsValid({ account: '471000', label: 'Erreur', debit: 1000, credit: 1000 }), false);
});

test('entry starts as draft with debit and credit control totals', () => {
  const draft = createDraftEntry({ id: 'entry-1', lines: balancedLines, label: 'Facture fournisseur' });

  assert.equal(draft.status, 'draft');
  assert.equal(draft.totals.debit, 100000);
  assert.equal(draft.totals.credit, 100000);
  assert.equal(draft.totals.difference, 0);
});

test('validated entry becomes immutable and cannot be updated directly', () => {
  const draft = createDraftEntry({ id: 'entry-1', lines: balancedLines, label: 'Facture fournisseur' });
  const validated = validateEntry({ entry: draft, validatedAt: new Date('2026-09-16T10:00:00Z') });

  assert.equal(validated.status, 'validated');
  assert.equal(validated.immutable, true);
  assert.throws(() => updateDraftEntry({ entry: validated, lines: unbalancedLines }), /validated entries are immutable/);
});

test('counter-entry reverses a validated entry and links the origin', () => {
  const validated = validateEntry({
    entry: createDraftEntry({ id: 'entry-1', lines: balancedLines, label: 'Facture fournisseur' }),
    validatedAt: new Date('2026-09-16T10:00:00Z')
  });
  const reversal = createReversalEntry({ entry: validated, id: 'entry-1-r', createdAt: new Date('2026-09-17T10:00:00Z') });

  assert.equal(reversal.status, 'draft');
  assert.equal(reversal.reversalOfEntryId, 'entry-1');
  assert.deepEqual(reversal.lines.map((line) => ({ debit: line.debit, credit: line.credit })), [
    { debit: 0, credit: 100000 },
    { debit: 100000, credit: 0 }
  ]);
  assert.equal(isBalanced(reversal.lines), true);
});

test('official accounting states exclude draft entries', () => {
  const draft = createDraftEntry({ id: 'entry-1', lines: balancedLines, label: 'Brouillard' });
  const validated = validateEntry({
    entry: createDraftEntry({ id: 'entry-2', lines: balancedLines, label: 'Validée' }),
    validatedAt: new Date('2026-09-16T10:00:00Z')
  });

  assert.deepEqual(filterOfficialEntries([draft, validated]).map((entry) => entry.id), ['entry-2']);
});
