const rolePermissions = {
  owner: ['company:create', 'company:update', 'fiscal-year:create', 'fiscal-year:close', 'user:invite', 'user:disable', 'entry:create', 'entry:update', 'entry:validate', 'entry:reverse', 'attachment:create', 'attachment:delete', 'state:read', 'export:create', 'subscription:manage'],
  admin: ['company:create', 'company:update', 'fiscal-year:create', 'fiscal-year:close', 'user:invite', 'user:disable', 'entry:create', 'entry:update', 'entry:validate', 'entry:reverse', 'attachment:create', 'attachment:delete', 'state:read', 'export:create', 'subscription:manage'],
  accountant: ['entry:create', 'entry:update', 'entry:validate', 'attachment:create', 'attachment:delete', 'state:read', 'export:create'],
  reader: ['state:read', 'export:create', 'attachment:read']
};

const protectedRoutes = new Set(['/entreprises', '/administration']);

export function canInviteRole({ inviterRole, invitedRole }) {
  if (inviterRole === 'owner') return ['admin', 'accountant', 'reader'].includes(invitedRole);
  if (inviterRole === 'admin') return ['accountant', 'reader'].includes(invitedRole);
  return false;
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export function createInvitation({ inviter, email, role, companyIds = [], companies, now = new Date() }) {
  if (!canInviteRole({ inviterRole: inviter.role, invitedRole: role })) throw new Error('inviter cannot invite this role');
  const normalizedEmail = normalizeEmail(email);
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) throw new Error('invalid email');
  const organizationCompanyIds = new Set(companies.filter((company) => company.organizationId === inviter.organizationId).map((company) => company.id));
  if (!companyIds.every((companyId) => organizationCompanyIds.has(companyId))) throw new Error('company outside organization');

  return {
    organizationId: inviter.organizationId,
    invitedBy: inviter.userId,
    email: normalizedEmail,
    role,
    companyIds,
    status: 'pending',
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  };
}

export function acceptInvitation({ invitation, acceptingUserId, now = new Date() }) {
  if (invitation.status !== 'pending') throw new Error('invitation is not pending');
  if (now > invitation.expiresAt) throw new Error('invitation expired');

  return {
    membership: {
      userId: acceptingUserId,
      organizationId: invitation.organizationId,
      role: invitation.role
    },
    companyAccess: invitation.companyIds.map((companyId) => ({
      userId: acceptingUserId,
      companyId,
      permissions: rolePermissions[invitation.role]
    })),
    acceptedAt: now
  };
}

export function routeAccessForSession({ path, session }) {
  if (!protectedRoutes.has(path)) return { allowed: true };
  if (!session?.userId) return { allowed: false, reason: 'anonymous' };
  return { allowed: true };
}
