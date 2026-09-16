import { canPerformAction, visibleCompaniesForUser, type Company, type CompanyAccess, type OrganizationMembership } from '@/lib/access-control';

const memberships: OrganizationMembership[] = [
  { userId: 'u-owner', organizationId: 'cabinet-a', role: 'owner' },
  { userId: 'u-accountant', organizationId: 'cabinet-a', role: 'accountant' },
  { userId: 'u-reader', organizationId: 'cabinet-a', role: 'reader' }
];

const companies: Company[] = [
  { id: 'alpha', organizationId: 'cabinet-a', name: 'Société Alpha' },
  { id: 'beta', organizationId: 'cabinet-a', name: 'Beta SARL' },
  { id: 'gamma', organizationId: 'cabinet-b', name: 'Gamma Services' }
];

const companyAccess: CompanyAccess[] = [
  { userId: 'u-accountant', companyId: 'alpha', permissions: ['entry:create', 'entry:validate', 'state:read', 'export:create'] },
  { userId: 'u-reader', companyId: 'alpha', permissions: ['state:read', 'export:create'] }
];

export default function AdministrationPage() {
  const visibleForOwner = visibleCompaniesForUser({ userId: 'u-owner', memberships, companyAccess, companies });
  const readerCanValidate = canPerformAction({ userId: 'u-reader', companyId: 'alpha', action: 'entry:validate', memberships, companyAccess, companies });
  const suspendedCanImport = canPerformAction({ userId: 'u-owner', companyId: 'alpha', action: 'import:create', memberships, companyAccess, companies, subscriptionStatus: 'suspended' });

  return (
    <main className="page-wrap">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Socle multi-tenant</p>
          <h1>Administration cabinet</h1>
          <p>Contrôle des accès par cabinet, entreprise et rôle. Les données ci-dessous démontrent les règles MVP avant connexion à Supabase.</p>
        </div>
        <span className="status valid">RLS à connecter</span>
      </section>

      <section className="card page-card">
        <h2>Entreprises visibles par le propriétaire cabinet</h2>
        <div className="company-list">
          {visibleForOwner.map((company) => (
            <div className="company-row" key={company.id}>
              <strong>{company.name}</strong>
              <span>{company.organizationId}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="kpis permissions-grid">
        <article className="card kpi">
          <div className="kpi-title">Lecteur → validation</div>
          <div className="kpi-value">{readerCanValidate ? 'Oui' : 'Non'}</div>
          <div className="delta neutral">Un lecteur consulte/exporte seulement</div>
        </article>
        <article className="card kpi">
          <div className="kpi-title">Suspendu → import</div>
          <div className="kpi-value">{suspendedCanImport ? 'Oui' : 'Non'}</div>
          <div className="delta warn">Lecture seule en suspension</div>
        </article>
      </section>
    </main>
  );
}
