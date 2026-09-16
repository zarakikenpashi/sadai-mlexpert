import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canAccessCompany,
  canPerformAction,
  effectiveSubscriptionMode,
  visibleCompaniesForUser
} from '../lib/access-control.mjs';

const memberships = [
  { userId: 'u-owner', organizationId: 'cabinet-a', role: 'owner' },
  { userId: 'u-admin', organizationId: 'cabinet-a', role: 'admin' },
  { userId: 'u-accountant', organizationId: 'cabinet-a', role: 'accountant' },
  { userId: 'u-reader', organizationId: 'cabinet-a', role: 'reader' },
  { userId: 'u-outsider', organizationId: 'cabinet-b', role: 'owner' }
];

const companyAccess = [
  { userId: 'u-accountant', companyId: 'alpha', permissions: ['entry:create', 'entry:validate', 'state:read', 'export:create'] },
  { userId: 'u-reader', companyId: 'alpha', permissions: ['state:read', 'export:create'] }
];

const companies = [
  { id: 'alpha', organizationId: 'cabinet-a', name: 'Société Alpha' },
  { id: 'beta', organizationId: 'cabinet-a', name: 'Beta SARL' },
  { id: 'gamma', organizationId: 'cabinet-b', name: 'Gamma Services' }
];

test('owner and admin can access every company in their own cabinet only', () => {
  assert.equal(canAccessCompany({ userId: 'u-owner', companyId: 'alpha', memberships, companyAccess, companies }), true);
  assert.equal(canAccessCompany({ userId: 'u-admin', companyId: 'beta', memberships, companyAccess, companies }), true);
  assert.equal(canAccessCompany({ userId: 'u-owner', companyId: 'gamma', memberships, companyAccess, companies }), false);
});

test('accountant and reader need explicit company assignment', () => {
  assert.equal(canAccessCompany({ userId: 'u-accountant', companyId: 'alpha', memberships, companyAccess, companies }), true);
  assert.equal(canAccessCompany({ userId: 'u-accountant', companyId: 'beta', memberships, companyAccess, companies }), false);
  assert.equal(canAccessCompany({ userId: 'u-reader', companyId: 'alpha', memberships, companyAccess, companies }), true);
  assert.equal(canAccessCompany({ userId: 'u-reader', companyId: 'beta', memberships, companyAccess, companies }), false);
});

test('reader can export but cannot create or validate entries', () => {
  assert.equal(canPerformAction({ userId: 'u-reader', companyId: 'alpha', action: 'export:create', memberships, companyAccess, companies }), true);
  assert.equal(canPerformAction({ userId: 'u-reader', companyId: 'alpha', action: 'entry:create', memberships, companyAccess, companies }), false);
  assert.equal(canPerformAction({ userId: 'u-reader', companyId: 'alpha', action: 'entry:validate', memberships, companyAccess, companies }), false);
});

test('suspended subscription is read-only: exports allowed, mutations blocked', () => {
  const context = { userId: 'u-admin', companyId: 'alpha', memberships, companyAccess, companies };
  assert.equal(effectiveSubscriptionMode('active'), 'write');
  assert.equal(effectiveSubscriptionMode('suspended'), 'read-only');
  assert.equal(canPerformAction({ ...context, action: 'export:create', subscriptionStatus: 'suspended' }), true);
  assert.equal(canPerformAction({ ...context, action: 'entry:create', subscriptionStatus: 'suspended' }), false);
});

test('visible companies never include another cabinet', () => {
  assert.deepEqual(visibleCompaniesForUser({ userId: 'u-owner', memberships, companyAccess, companies }).map((company) => company.id), ['alpha', 'beta']);
  assert.deepEqual(visibleCompaniesForUser({ userId: 'u-outsider', memberships, companyAccess, companies }).map((company) => company.id), ['gamma']);
});
