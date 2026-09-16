import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(currentDir, '../data/syscohada-plan.json');

export const syscohadaAccounts = JSON.parse(readFileSync(dataPath, 'utf8'));

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function searchAccounts({ query, accounts = syscohadaAccounts }) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return accounts;
  return accounts.filter((account) => normalize(`${account.code} ${account.label}`).includes(normalizedQuery));
}

export function filterAccountsByClass({ accountClass, accounts = syscohadaAccounts }) {
  return accounts.filter((account) => account.class === String(accountClass));
}

export function createClientSubAccount({ parentCode, code, label, organizationId, existingAccounts = syscohadaAccounts }) {
  const parent = existingAccounts.find((account) => account.code === parentCode && account.isStandard);
  if (!parent) throw new Error('standard parent account not found');
  if (!code.startsWith(parentCode.slice(0, 3))) throw new Error('sub-account must stay in the parent account family');
  if (existingAccounts.some((account) => account.code === code)) throw new Error('account code already exists');

  return {
    code,
    label: label.trim(),
    class: code[0],
    isStandard: false,
    parentCode,
    organizationId
  };
}

export function canModifyAccount({ account, usedEntryLines = [] }) {
  const used = usedEntryLines.some((line) => line.account === account.code || line.accountCode === account.code);
  if (account.isStandard && used) return { allowed: false, reason: 'standard-account-used' };
  if (used) return { allowed: false, reason: 'account-used' };
  return { allowed: true };
}
