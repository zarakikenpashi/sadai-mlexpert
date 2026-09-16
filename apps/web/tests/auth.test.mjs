import assert from 'node:assert/strict';
import test from 'node:test';

import {
  acceptInvitation,
  canInviteRole,
  createInvitation,
  routeAccessForSession
} from '../lib/auth.mjs';

const now = new Date('2026-01-10T10:00:00Z');

const owner = { userId: 'u-owner', organizationId: 'cabinet-a', role: 'owner' };
const admin = { userId: 'u-admin', organizationId: 'cabinet-a', role: 'admin' };
const accountant = { userId: 'u-accountant', organizationId: 'cabinet-a', role: 'accountant' };

const companies = [
  { id: 'alpha', organizationId: 'cabinet-a', name: 'Alpha' },
  { id: 'beta', organizationId: 'cabinet-a', name: 'Beta' }
];

test('only owner and admin can invite cabinet users', () => {
  assert.equal(canInviteRole({ inviterRole: owner.role, invitedRole: 'admin' }), true);
  assert.equal(canInviteRole({ inviterRole: admin.role, invitedRole: 'accountant' }), true);
  assert.equal(canInviteRole({ inviterRole: accountant.role, invitedRole: 'reader' }), false);
});

test('invitation creation normalizes email, sets expiry and optional company assignments', () => {
  const invitation = createInvitation({
    inviter: admin,
    email: '  Lecteur@Example.COM ',
    role: 'reader',
    companyIds: ['alpha'],
    companies,
    now
  });

  assert.equal(invitation.email, 'lecteur@example.com');
  assert.equal(invitation.role, 'reader');
  assert.deepEqual(invitation.companyIds, ['alpha']);
  assert.equal(invitation.status, 'pending');
  assert.equal(invitation.expiresAt.toISOString(), '2026-01-17T10:00:00.000Z');
});

test('invitation acceptance creates organization membership and explicit company assignments', () => {
  const invitation = createInvitation({ inviter: admin, email: 'c@example.com', role: 'accountant', companyIds: ['alpha'], companies, now });
  const accepted = acceptInvitation({ invitation, acceptingUserId: 'u-new', now: new Date('2026-01-12T10:00:00Z') });

  assert.deepEqual(accepted.membership, { userId: 'u-new', organizationId: 'cabinet-a', role: 'accountant' });
  assert.deepEqual(accepted.companyAccess, [{ userId: 'u-new', companyId: 'alpha', permissions: ['entry:create', 'entry:update', 'entry:validate', 'attachment:create', 'attachment:delete', 'state:read', 'export:create'] }]);
});

test('expired or revoked invitations cannot be accepted', () => {
  const invitation = createInvitation({ inviter: admin, email: 'late@example.com', role: 'reader', companyIds: ['alpha'], companies, now });

  assert.throws(() => acceptInvitation({ invitation, acceptingUserId: 'u-late', now: new Date('2026-01-20T10:00:00Z') }), /expired/);
  assert.throws(() => acceptInvitation({ invitation: { ...invitation, status: 'revoked' }, acceptingUserId: 'u-late', now }), /not pending/);
});

test('protected MVP routes reject anonymous sessions', () => {
  assert.equal(routeAccessForSession({ path: '/entreprises', session: null }).allowed, false);
  assert.equal(routeAccessForSession({ path: '/administration', session: null }).allowed, false);
  assert.equal(routeAccessForSession({ path: '/login', session: null }).allowed, true);
  assert.equal(routeAccessForSession({ path: '/entreprises', session: { userId: 'u-owner' } }).allowed, true);
});
