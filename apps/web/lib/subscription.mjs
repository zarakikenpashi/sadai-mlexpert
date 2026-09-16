export const plans = [
  { code: 'starter', name: 'Starter', maxCompanies: 3, maxUsers: 2 },
  { code: 'pro', name: 'Pro', maxCompanies: 12, maxUsers: 10 },
  { code: 'cabinet', name: 'Cabinet', maxCompanies: 50, maxUsers: 30 }
];

export const subscriptionStatuses = ['trial', 'active', 'grace', 'suspended', 'terminated'];

const readOnlyActions = new Set(['state:read', 'export:create', 'attachment:read']);

export function canUseActionUnderSubscription({ status, action }) {
  if (['trial', 'active', 'grace'].includes(status)) return { allowed: true };
  if (status === 'suspended') {
    if (readOnlyActions.has(action)) return { allowed: true };
    return { allowed: false, reason: 'subscription-read-only' };
  }
  return { allowed: false, reason: 'subscription-terminated' };
}

export function changeSubscriptionStatus({ subscription, nextStatus, actorUserId, reason, changedAt = new Date() }) {
  if (!subscriptionStatuses.includes(nextStatus)) throw new Error('invalid subscription status');
  if (!reason?.trim()) throw new Error('status change reason is required');
  return {
    ...subscription,
    status: nextStatus,
    history: [
      ...(subscription.history ?? []),
      {
        previousStatus: subscription.status,
        newStatus: nextStatus,
        actorUserId,
        reason,
        changedAt
      }
    ]
  };
}

export function checkPlanLimits({ planCode, companiesCount, usersCount }) {
  const plan = plans.find((candidate) => candidate.code === planCode);
  if (!plan) throw new Error('unknown plan');
  if (companiesCount > plan.maxCompanies) return { allowed: false, reason: 'company-limit-exceeded' };
  if (usersCount > plan.maxUsers) return { allowed: false, reason: 'user-limit-exceeded' };
  return { allowed: true };
}
