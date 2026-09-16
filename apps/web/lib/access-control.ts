export type OrganizationRole = 'owner' | 'admin' | 'accountant' | 'reader';
export type SubscriptionStatus = 'trial' | 'active' | 'grace' | 'suspended' | 'terminated';
export type SubscriptionMode = 'write' | 'read-only';

export type OrganizationMembership = {
  userId: string;
  organizationId: string;
  role: OrganizationRole;
};

export type Company = {
  id: string;
  organizationId: string;
  name: string;
};

export type CompanyAccess = {
  userId: string;
  companyId: string;
  permissions: string[];
};

const ownerAdminActions = new Set([
  'company:create',
  'company:update',
  'fiscal-year:create',
  'fiscal-year:close',
  'user:invite',
  'user:disable',
  'entry:create',
  'entry:update',
  'entry:validate',
  'entry:reverse',
  'attachment:create',
  'attachment:delete',
  'state:read',
  'export:create',
  'subscription:manage'
]);

const mutationActions = new Set([
  'company:create',
  'company:update',
  'fiscal-year:create',
  'fiscal-year:close',
  'user:invite',
  'user:disable',
  'entry:create',
  'entry:update',
  'entry:validate',
  'entry:reverse',
  'attachment:create',
  'attachment:delete',
  'import:create',
  'subscription:manage'
]);

export function effectiveSubscriptionMode(status: SubscriptionStatus = 'active'): SubscriptionMode {
  if (status === 'suspended' || status === 'terminated') return 'read-only';
  return 'write';
}

export function membershipForUser(userId: string, memberships: OrganizationMembership[]) {
  return memberships.find((membership) => membership.userId === userId) ?? null;
}

export function companyById(companyId: string, companies: Company[]) {
  return companies.find((company) => company.id === companyId) ?? null;
}

export function assignmentForUserCompany(userId: string, companyId: string, companyAccess: CompanyAccess[]) {
  return companyAccess.find((access) => access.userId === userId && access.companyId === companyId) ?? null;
}

export function canAccessCompany(input: {
  userId: string;
  companyId: string;
  memberships: OrganizationMembership[];
  companyAccess: CompanyAccess[];
  companies: Company[];
}): boolean {
  const company = companyById(input.companyId, input.companies);
  const membership = membershipForUser(input.userId, input.memberships);
  if (!company || !membership) return false;
  if (membership.organizationId !== company.organizationId) return false;
  if (membership.role === 'owner' || membership.role === 'admin') return true;
  return Boolean(assignmentForUserCompany(input.userId, input.companyId, input.companyAccess));
}

export function canPerformAction(input: {
  userId: string;
  companyId: string;
  action: string;
  memberships: OrganizationMembership[];
  companyAccess: CompanyAccess[];
  companies: Company[];
  subscriptionStatus?: SubscriptionStatus;
}): boolean {
  if (!canAccessCompany(input)) return false;
  if (effectiveSubscriptionMode(input.subscriptionStatus ?? 'active') === 'read-only' && mutationActions.has(input.action)) return false;
  const membership = membershipForUser(input.userId, input.memberships);
  if (membership?.role === 'owner' || membership?.role === 'admin') return ownerAdminActions.has(input.action);
  const assignment = assignmentForUserCompany(input.userId, input.companyId, input.companyAccess);
  return assignment?.permissions.includes(input.action) ?? false;
}

export function visibleCompaniesForUser(input: {
  userId: string;
  memberships: OrganizationMembership[];
  companyAccess: CompanyAccess[];
  companies: Company[];
}): Company[] {
  const membership = membershipForUser(input.userId, input.memberships);
  if (!membership) return [];
  const organizationCompanies = input.companies.filter((company) => company.organizationId === membership.organizationId);
  if (membership.role === 'owner' || membership.role === 'admin') return organizationCompanies;
  const allowedCompanyIds = new Set(input.companyAccess.filter((access) => access.userId === input.userId).map((access) => access.companyId));
  return organizationCompanies.filter((company) => allowedCompanyIds.has(company.id));
}
