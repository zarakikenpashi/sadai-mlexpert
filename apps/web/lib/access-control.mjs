export const roleRank = {
  owner: 4,
  admin: 3,
  accountant: 2,
  reader: 1
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

const readOnlyActions = new Set(['state:read', 'export:create', 'attachment:read']);
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

export function effectiveSubscriptionMode(status = 'active') {
  if (status === 'suspended' || status === 'terminated') return 'read-only';
  if (status === 'trial' || status === 'active' || status === 'grace') return 'write';
  return 'read-only';
}

export function membershipForUser(userId, memberships) {
  return memberships.find((membership) => membership.userId === userId) ?? null;
}

export function companyById(companyId, companies) {
  return companies.find((company) => company.id === companyId) ?? null;
}

export function assignmentForUserCompany(userId, companyId, companyAccess) {
  return companyAccess.find((access) => access.userId === userId && access.companyId === companyId) ?? null;
}

export function canAccessCompany({ userId, companyId, memberships, companyAccess, companies }) {
  const company = companyById(companyId, companies);
  const membership = membershipForUser(userId, memberships);
  if (!company || !membership) return false;
  if (membership.organizationId !== company.organizationId) return false;
  if (membership.role === 'owner' || membership.role === 'admin') return true;
  return Boolean(assignmentForUserCompany(userId, companyId, companyAccess));
}

export function canPerformAction({
  userId,
  companyId,
  action,
  memberships,
  companyAccess,
  companies,
  subscriptionStatus = 'active'
}) {
  if (!canAccessCompany({ userId, companyId, memberships, companyAccess, companies })) return false;
  const mode = effectiveSubscriptionMode(subscriptionStatus);
  if (mode === 'read-only' && mutationActions.has(action)) return false;
  const membership = membershipForUser(userId, memberships);
  if (membership?.role === 'owner' || membership?.role === 'admin') return ownerAdminActions.has(action) || readOnlyActions.has(action);
  const assignment = assignmentForUserCompany(userId, companyId, companyAccess);
  return assignment?.permissions?.includes(action) ?? false;
}

export function visibleCompaniesForUser({ userId, memberships, companyAccess, companies }) {
  const membership = membershipForUser(userId, memberships);
  if (!membership) return [];
  const organizationCompanies = companies.filter((company) => company.organizationId === membership.organizationId);
  if (membership.role === 'owner' || membership.role === 'admin') return organizationCompanies;
  const allowedCompanyIds = new Set(companyAccess.filter((access) => access.userId === userId).map((access) => access.companyId));
  return organizationCompanies.filter((company) => allowedCompanyIds.has(company.id));
}
