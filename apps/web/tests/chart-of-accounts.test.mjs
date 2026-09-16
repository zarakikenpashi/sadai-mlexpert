import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

import {
  canModifyAccount,
  createClientSubAccount,
  filterAccountsByClass,
  searchAccounts,
  syscohadaAccounts
} from '../lib/chart-of-accounts.mjs';

const seed = JSON.parse(readFileSync(resolve(process.cwd(), 'data/syscohada-plan.json'), 'utf8'));

test('SYSCOHADA plan from client workbook is available as seed data', () => {
  assert.ok(seed.length >= 1300, `expected full client plan, got ${seed.length}`);
  assert.deepEqual(seed[0], { code: '101000', label: 'CAPITAL SOCIAL', class: '1', isStandard: true });
  assert.equal(syscohadaAccounts.length, seed.length);
});

test('accounts can be searched and filtered by class', () => {
  const capitalMatches = searchAccounts({ query: 'capital social', accounts: syscohadaAccounts });
  assert.equal(capitalMatches[0].code, '101000');

  const classSix = filterAccountsByClass({ accountClass: '6', accounts: syscohadaAccounts });
  assert.ok(classSix.length > 0);
  assert.ok(classSix.every((account) => account.code.startsWith('6')));
});

test('client sub-account attaches to an existing standard parent', () => {
  const subAccount = createClientSubAccount({
    parentCode: '601000',
    code: '601001',
    label: 'Achat marchandises client Alpha',
    organizationId: 'cabinet-a',
    existingAccounts: syscohadaAccounts
  });

  assert.equal(subAccount.parentCode, '601000');
  assert.equal(subAccount.isStandard, false);
  assert.equal(subAccount.organizationId, 'cabinet-a');
});

test('used standard accounts are protected from modification or deletion', () => {
  const usedEntryLines = [{ account: '601000' }, { account: '401000' }];

  assert.deepEqual(canModifyAccount({ account: { code: '601000', isStandard: true }, usedEntryLines }), {
    allowed: false,
    reason: 'standard-account-used'
  });

  assert.deepEqual(canModifyAccount({ account: { code: '601001', isStandard: false }, usedEntryLines }), { allowed: true });
});
