import { visibleCompaniesForUser, type Company, type CompanyAccess, type OrganizationMembership } from '@/lib/access-control';

const memberships: OrganizationMembership[] = [
  { userId: 'u-accountant', organizationId: 'cabinet-a', role: 'accountant' }
];
const companies: Company[] = [
  { id: 'alpha', organizationId: 'cabinet-a', name: 'Société Alpha' },
  { id: 'beta', organizationId: 'cabinet-a', name: 'Beta SARL' },
  { id: 'gamma', organizationId: 'cabinet-b', name: 'Gamma Services' }
];
const companyAccess: CompanyAccess[] = [
  { userId: 'u-accountant', companyId: 'alpha', permissions: ['entry:create', 'entry:validate', 'state:read', 'export:create'] }
];

export default function CompaniesPage() {
  const visibleCompanies = visibleCompaniesForUser({ userId: 'u-accountant', memberships, companyAccess, companies });

  return (
    <main className="page-wrap">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Entreprises clientes</p>
          <h1>Dossiers accessibles</h1>
          <p>Un comptable voit uniquement les entreprises auxquelles il est explicitement affecté.</p>
        </div>
        <button className="primary">+ Nouvelle entreprise</button>
      </section>
      <section className="card table-card">
        <div className="table-top"><div><h3>Liste filtrée par permissions</h3><div className="muted">Simulation du futur comportement RLS côté Supabase</div></div></div>
        <table>
          <thead><tr><th>Entreprise</th><th>Cabinet</th><th>Permissions</th><th>Action</th></tr></thead>
          <tbody>
            {visibleCompanies.map((company) => (
              <tr key={company.id}><td>{company.name}</td><td>{company.organizationId}</td><td>Créer, valider, consulter, exporter</td><td><span className="status valid">Ouvrir</span></td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
