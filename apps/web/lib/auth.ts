export type OrganizationRole = 'owner' | 'admin' | 'accountant' | 'reader';
export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

type Inviter = { userId: string; organizationId: string; role: OrganizationRole };
type Company = { id: string; organizationId: string; name: string };
type Invitation = {
  organizationId: string;
  invitedBy: string;
  email: string;
  role: OrganizationRole;
  companyIds: string[];
  status: InvitationStatus;
  expiresAt: Date;
};

const rolePermissions: Record<OrganizationRole, string[]> = {
  owner: ['company:create', 'company:update', 'fiscal-year:create', 'fiscal-year:close', 'user:invite', 'user:disable', 'entry:create', 'entry:update', 'entry:validate', 'entry:reverse', 'attachment:create', 'attachment:delete', 'state:read', 'export:create', 'subscription:manage'],
  admin: ['company:create', 'company:update', 'fiscal-year:create', 'fiscal-year:close', 'user:invite', 'user:disable', 'entry:create', 'entry:update', 'entry:validate', 'entry:reverse', 'attachment:create', 'attachment:delete', 'state:read', 'export:create', 'subscription:manage'],
  accountant: ['entry:create', 'entry:update', 'entry:validate', 'attachment:create', 'attachment:delete', 'state:read', 'export:create'],
  reader: ['state:read', 'export:create', 'attachment:read']
};

const protectedRoutes = new Set(['/entreprises', '/administration']);

export function canInviteRole(input: { inviterRole: OrganizationRole; invitedRole: OrganizationRole }): boolean {
  if (input.inviterRole === 'owner') return ['admin', 'accountant', 'reader'].includes(input.invitedRole);
  if (input.inviterRole === 'admin') return ['accountant', 'reader'].includes(input.invitedRole);
  return false;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function createInvitation(input: { inviter: Inviter; email: string; role: OrganizationRole; companyIds?: string[]; companies: Company[]; now?: Date }): Invitation {
  const companyIds = input.companyIds ?? [];
  const now = input.now ?? new Date();
  if (!canInviteRole({ inviterRole: input.inviter.role, invitedRole: input.role })) throw new Error('inviter cannot invite this role');
  const normalizedEmail = normalizeEmail(input.email);
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) throw new Error('invalid email');
  const organizationCompanyIds = new Set(input.companies.filter((company) => company.organizationId === input.inviter.organizationId).map((company) => company.id));
  if (!companyIds.every((companyId) => organizationCompanyIds.has(companyId))) throw new Error('company outside organization');

  return {
    organizationId: input.inviter.organizationId,
    invitedBy: input.inviter.userId,
    email: normalizedEmail,
    role: input.role,
    companyIds,
    status: 'pending',
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  };
}

export function acceptInvitation(input: { invitation: Invitation; acceptingUserId: string; now?: Date }) {
  const now = input.now ?? new Date();
  if (input.invitation.status !== 'pending') throw new Error('invitation is not pending');
  if (now > input.invitation.expiresAt) throw new Error('invitation expired');

  return {
    membership: {
      userId: input.acceptingUserId,
      organizationId: input.invitation.organizationId,
      role: input.invitation.role
    },
    companyAccess: input.invitation.companyIds.map((companyId) => ({
      userId: input.acceptingUserId,
      companyId,
      permissions: rolePermissions[input.invitation.role]
    })),
    acceptedAt: now
  };
}

export function routeAccessForSession(input: { path: string; session: { userId: string } | null }) {
  if (!protectedRoutes.has(input.path)) return { allowed: true };
  if (!input.session?.userId) return { allowed: false, reason: 'anonymous' };
  return { allowed: true };
}
