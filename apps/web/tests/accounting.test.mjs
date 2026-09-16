import assert from 'node:assert/strict';
import test from 'node:test';

function lineIsValid(line) {
  const debit = Number(line.debit || 0);
  const credit = Number(line.credit || 0);
  if (debit < 0 || credit < 0) return false;
  return (debit > 0 && credit === 0) || (credit > 0 && debit === 0);
}
function totals(lines) {
  return lines.reduce((acc, line) => ({ debit: acc.debit + Number(line.debit || 0), credit: acc.credit + Number(line.credit || 0) }), { debit: 0, credit: 0 });
}
function isBalanced(lines) {
  if (lines.length < 2) return false;
  if (!lines.every(lineIsValid)) return false;
  const total = totals(lines);
  return total.debit > 0 && total.debit === total.credit;
}

test('balanced entry can be validated', () => {
  assert.equal(isBalanced([
    { account: '601000', label: 'Achat', debit: 100000, credit: 0 },
    { account: '401000', label: 'Fournisseur', debit: 0, credit: 100000 }
  ]), true);
});

test('unbalanced entry is rejected', () => {
  assert.equal(isBalanced([
    { account: '601000', label: 'Achat', debit: 100000, credit: 0 },
    { account: '401000', label: 'Fournisseur', debit: 0, credit: 90000 }
  ]), false);
});

test('line cannot contain debit and credit together', () => {
  assert.equal(lineIsValid({ account: '471000', label: 'Erreur', debit: 1000, credit: 1000 }), false);
});
