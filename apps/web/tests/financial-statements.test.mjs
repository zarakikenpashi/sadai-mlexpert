import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildExportMetadata,
  buildGeneralBalance,
  buildGeneralLedger,
  canExportStates,
  filterStateEntries,
  generateStateExportPayloads
} from '../lib/financial-statements.mjs';

const entries = [
  {
    id: 'v1',
    status: 'validated',
    journal: 'ACH',
    date: '2026-09-16',
    lines: [
      { account: '601000', label: 'Achat marchandises', debit: 100000, credit: 0 },
      { account: '401000', label: 'Fournisseur ABC', debit: 0, credit: 100000 }
    ]
  },
  {
    id: 'v2',
    status: 'validated',
    journal: 'VEN',
    date: '2026-09-17',
    lines: [
      { account: '411000', label: 'Client DEF', debit: 250000, credit: 0 },
      { account: '701000', label: 'Vente marchandises', debit: 0, credit: 250000 }
    ]
  },
  {
    id: 'd1',
    status: 'draft',
    journal: 'ACH',
    date: '2026-09-18',
    lines: [
      { account: '601000', label: 'Brouillon', debit: 5000, credit: 0 },
      { account: '401000', label: 'Brouillon', debit: 0, credit: 5000 }
    ]
  }
];

const metadata = {
  cabinet: 'Cabinet ABC',
  company: 'Société Alpha',
  fiscalYear: 2026,
  period: '2026-09-01 — 2026-09-30',
  generatedAt: '2026-09-16T22:00:00Z'
};

test('general balance excludes drafts and remains globally balanced', () => {
  const balance = buildGeneralBalance({ entries });

  assert.equal(balance.totals.debit, 350000);
  assert.equal(balance.totals.credit, 350000);
  assert.equal(balance.totals.difference, 0);
  assert.ok(balance.rows.some((row) => row.account === '601000' && row.debit === 100000));
  assert.equal(balance.rows.some((row) => row.account === '401000' && row.credit === 105000), false);
});

test('ledger groups movements by account with running balance', () => {
  const ledger = buildGeneralLedger({ entries });

  assert.deepEqual(ledger['601000'].movements.map((movement) => movement.entryId), ['v1']);
  assert.equal(ledger['411000'].closingBalance, 250000);
  assert.equal(ledger['701000'].closingBalance, -250000);
});

test('state filters apply period, journal and account class', () => {
  const filtered = filterStateEntries({ entries, periodStart: '2026-09-17', periodEnd: '2026-09-30', journal: 'VEN', accountClass: '7' });

  assert.equal(filtered.length, 1);
  assert.deepEqual(filtered[0].lines.map((line) => line.account), ['701000']);
});

test('exports include required metadata for Excel and PDF payloads', () => {
  const exportMetadata = buildExportMetadata(metadata);
  const payloads = generateStateExportPayloads({ entries, metadata: exportMetadata });

  for (const payload of [payloads.excel, payloads.pdf]) {
    assert.equal(payload.metadata.cabinet, 'Cabinet ABC');
    assert.equal(payload.metadata.company, 'Société Alpha');
    assert.equal(payload.metadata.fiscalYear, 2026);
    assert.equal(payload.metadata.period, '2026-09-01 — 2026-09-30');
    assert.equal(payload.metadata.generatedAt, '2026-09-16T22:00:00Z');
  }

  assert.match(payloads.pdf.html, /Cabinet ABC/);
  assert.match(payloads.pdf.html, /Balance générale/);
  assert.deepEqual(payloads.excel.workbook.sheets[0].rows[0], ['Compte', 'Libellé', 'Débit', 'Crédit', 'Solde']);
});

test('export permission mirrors screen permission', () => {
  assert.equal(canExportStates({ permissions: ['state:read', 'export:create'] }), true);
  assert.equal(canExportStates({ permissions: ['state:read'] }), false);
});
