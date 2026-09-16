import { canUseActionUnderSubscription, changeSubscriptionStatus, checkPlanLimits, plans, subscriptionStatuses } from '@/lib/subscription';

const currentPlan = plans.find((plan) => plan.code === 'cabinet')!;
const usage = { companiesCount: 24, usersCount: 15 };
const limits = checkPlanLimits({ planCode: currentPlan.code, ...usage });
const readAllowed = canUseActionUnderSubscription({ status: 'suspended', action: 'state:read' });
const importBlocked = canUseActionUnderSubscription({ status: 'suspended', action: 'import:create' });
const auditedChange = changeSubscriptionStatus({
  subscription: { id: 'sub-1', status: 'active', history: [] },
  nextStatus: 'suspended',
  actorUserId: 'u-admin',
  reason: 'Facture impayée',
  changedAt: new Date('2026-09-16T12:00:00Z')
});

export default function Page() {
  return (
    <main className="page-wrap">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Abonnement SaaS manuel</p>
          <h1>Plans, statuts et lecture seule</h1>
          <p>
            Le MVP gère les changements d’abonnement manuellement. Une suspension conserve la consultation et les exports,
            mais bloque la création, la modification, l’import et les uploads.
          </p>
        </div>
        <span className="status draft">{subscriptionStatuses.join(' · ')}</span>
      </section>

      <section className="kpis permissions-grid">
        <article className="card kpi">
          <div className="kpi-title">Plan courant</div>
          <div className="kpi-value">{currentPlan.name}</div>
          <div className="delta neutral">{usage.companiesCount}/{currentPlan.maxCompanies} entreprises · {usage.usersCount}/{currentPlan.maxUsers} utilisateurs</div>
        </article>
        <article className="card kpi">
          <div className="kpi-title">Limites</div>
          <div className="kpi-value">{limits.allowed ? 'OK' : 'Bloqué'}</div>
          <div className="delta good">Quota contrôlé avant création</div>
        </article>
      </section>

      <section className="card table-card">
        <div className="table-top">
          <div>
            <h3>Plans MVP</h3>
            <div className="muted">Starter, Pro et Cabinet avec limites entreprises/utilisateurs.</div>
          </div>
        </div>
        <table>
          <thead><tr><th>Plan</th><th className="num">Entreprises</th><th className="num">Utilisateurs</th></tr></thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.code}><td>{plan.name}</td><td className="num">{plan.maxCompanies}</td><td className="num">{plan.maxUsers}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card table-card page-spacer">
        <div className="table-top">
          <div>
            <h3>Effet suspension</h3>
            <div className="muted">Lecture/export autorisés, mutations bloquées.</div>
          </div>
          <div className="table-actions"><span className="status draft">Suspendu</span></div>
        </div>
        <table>
          <thead><tr><th>Action</th><th>Résultat</th><th>Raison</th></tr></thead>
          <tbody>
            <tr><td>Consultation états</td><td><span className="status valid">{readAllowed.allowed ? 'Autorisé' : 'Bloqué'}</span></td><td>Lecture seule</td></tr>
            <tr><td>Import Excel</td><td><span className="status reject">{importBlocked.allowed ? 'Autorisé' : 'Bloqué'}</span></td><td>{importBlocked.allowed ? '—' : importBlocked.reason}</td></tr>
          </tbody>
        </table>
      </section>

      <section className="card page-card page-spacer">
        <h3>Audit du dernier changement</h3>
        <div className="company-list">
          <div className="company-row"><strong>Transition</strong><span>{auditedChange.history[0].previousStatus} → {auditedChange.history[0].newStatus}</span></div>
          <div className="company-row"><strong>Acteur</strong><span>{auditedChange.history[0].actorUserId}</span></div>
          <div className="company-row"><strong>Motif</strong><span>{auditedChange.history[0].reason}</span></div>
        </div>
      </section>
    </main>
  );
}
