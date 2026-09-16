import syscohadaSeed from '../data/syscohada-plan.json';

export type ChartAccount = {
  code: string;
  label: string;
  class: string;
  isStandard: boolean;
  parentCode?: string;
  organizationId?: string;
};

export type EntryLineAccountRef = {
  account?: string;
  accountCode?: string;
};

export const syscohadaAccounts = syscohadaSeed as ChartAccount[];

function normalize(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

export function searchAccounts({ query, accounts = syscohadaAccounts }: { query: string; accounts?: ChartAccount[] }): ChartAccount[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return accounts;
  return accounts.filter((account) => normalize(`${account.code} ${account.label}`).includes(normalizedQuery));
}

export function filterAccountsByClass({ accountClass, accounts = syscohadaAccounts }: { accountClass: string; accounts?: ChartAccount[] }): ChartAccount[] {
  return accounts.filter((account) => account.class === String(accountClass));
}

export function createClientSubAccount({
  parentCode,
  code,
  label,
  organizationId,
  existingAccounts = syscohadaAccounts
}: {
  parentCode: string;
  code: string;
  label: string;
  organizationId: string;
  existingAccounts?: ChartAccount[];
}): ChartAccount {
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

export function canModifyAccount({ account, usedEntryLines = [] }: { account: Pick<ChartAccount, 'code' | 'isStandard'>; usedEntryLines?: EntryLineAccountRef[] }) {
  const used = usedEntryLines.some((line) => line.account === account.code || line.accountCode === account.code);
  if (account.isStandard && used) return { allowed: false as const, reason: 'standard-account-used' as const };
  if (used) return { allowed: false as const, reason: 'account-used' as const };
  return { allowed: true as const };
}
