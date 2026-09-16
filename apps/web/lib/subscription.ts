export type PlanCode = 'starter' | 'pro' | 'cabinet';
export type SubscriptionStatus = 'trial' | 'active' | 'grace' | 'suspended' | 'terminated';

export const plans = [
  { code: 'starter' as const, name: 'Starter', maxCompanies: 3, maxUsers: 2 },
  { code: 'pro' as const, name: 'Pro', maxCompanies: 12, maxUsers: 10 },
  { code: 'cabinet' as const, name: 'Cabinet', maxCompanies: 50, maxUsers: 30 }
];

export const subscriptionStatuses: SubscriptionStatus[] = ['trial', 'active', 'grace', 'suspended', 'terminated'];

const readOnlyActions = new Set(['state:read', 'export:create', 'attachment:read']);

export function canUseActionUnderSubscription({ status, action }: { status: SubscriptionStatus; action: string }) {
  if (['trial', 'active', 'grace'].includes(status)) return { allowed: true as const };
  if (status === 'suspended') {
    if (readOnlyActions.has(action)) return { allowed: true as const };
    return { allowed: false as const, reason: 'subscription-read-only' as const };
  }
  return { allowed: false as const, reason: 'subscription-terminated' as const };
}

export function changeSubscriptionStatus({
  subscription,
  nextStatus,
  actorUserId,
  reason,
  changedAt = new Date()
}: {
  subscription: {
    id: string;
    status: SubscriptionStatus;
    history?: {
      previousStatus: SubscriptionStatus;
      newStatus: SubscriptionStatus;
      actorUserId: string;
      reason: string;
      changedAt: Date;
    }[];
  };
  nextStatus: SubscriptionStatus;
  actorUserId: string;
  reason: string;
  changedAt?: Date;
}) {
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

export function checkPlanLimits({ planCode, companiesCount, usersCount }: { planCode: PlanCode; companiesCount: number; usersCount: number }) {
  const plan = plans.find((candidate) => candidate.code === planCode);
  if (!plan) throw new Error('unknown plan');
  if (companiesCount > plan.maxCompanies) return { allowed: false as const, reason: 'company-limit-exceeded' as const };
  if (usersCount > plan.maxUsers) return { allowed: false as const, reason: 'user-limit-exceeded' as const };
  return { allowed: true as const };
}
