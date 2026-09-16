import assert from 'node:assert/strict';
import test from 'node:test';

import {
  changeSubscriptionStatus,
  canUseActionUnderSubscription,
  checkPlanLimits,
  plans,
  subscriptionStatuses
} from '../lib/subscription.mjs';

test('MVP exposes Starter Pro and Cabinet plans with company and user limits', () => {
  assert.deepEqual(plans.map((plan) => plan.code), ['starter', 'pro', 'cabinet']);
  assert.ok(plans.every((plan) => plan.maxCompanies > 0 && plan.maxUsers > 0));
});

test('manual subscription statuses include trial active grace suspended terminated', () => {
  assert.deepEqual(subscriptionStatuses, ['trial', 'active', 'grace', 'suspended', 'terminated']);
});

test('suspended subscription is read-only: read and export allowed, mutations blocked', () => {
  assert.equal(canUseActionUnderSubscription({ status: 'suspended', action: 'state:read' }).allowed, true);
  assert.equal(canUseActionUnderSubscription({ status: 'suspended', action: 'export:create' }).allowed, true);

  for (const action of ['company:create', 'entry:create', 'entry:update', 'import:create', 'attachment:create']) {
    assert.deepEqual(canUseActionUnderSubscription({ status: 'suspended', action }), { allowed: false, reason: 'subscription-read-only' });
  }
});

test('terminated subscription blocks every non-admin business action', () => {
  assert.equal(canUseActionUnderSubscription({ status: 'terminated', action: 'state:read' }).allowed, false);
  assert.equal(canUseActionUnderSubscription({ status: 'terminated', action: 'export:create' }).allowed, false);
});

test('status changes create audit history with actor reason and date', () => {
  const changed = changeSubscriptionStatus({
    subscription: { id: 'sub-1', status: 'active', history: [] },
    nextStatus: 'suspended',
    actorUserId: 'u-admin',
    reason: 'Facture impayée',
    changedAt: new Date('2026-09-16T12:00:00Z')
  });

  assert.equal(changed.status, 'suspended');
  assert.deepEqual(changed.history[0], {
    previousStatus: 'active',
    newStatus: 'suspended',
    actorUserId: 'u-admin',
    reason: 'Facture impayée',
    changedAt: new Date('2026-09-16T12:00:00Z')
  });
});

test('plan limits reject companies or users above quota', () => {
  assert.deepEqual(checkPlanLimits({ planCode: 'starter', companiesCount: 4, usersCount: 2 }), { allowed: false, reason: 'company-limit-exceeded' });
  assert.deepEqual(checkPlanLimits({ planCode: 'pro', companiesCount: 12, usersCount: 11 }), { allowed: false, reason: 'user-limit-exceeded' });
  assert.deepEqual(checkPlanLimits({ planCode: 'cabinet', companiesCount: 50, usersCount: 30 }), { allowed: true });
});
