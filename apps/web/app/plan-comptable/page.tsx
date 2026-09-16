import { filterAccountsByClass, searchAccounts, syscohadaAccounts } from '@/lib/chart-of-accounts';

const classOneAccounts = filterAccountsByClass({ accountClass: '1' }).slice(0, 4);
const marchandisesAccounts = searchAccounts({ query: 'marchandises' }).slice(0, 4);

export default function Page() {
  return (
    <main className="page-wrap">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Référentiel SYSCOHADA</p>
          <h1>Plan comptable client</h1>
          <p>
            Le plan fourni par le client est chargé comme référentiel de travail. Les comptes standards restent protégés,
            les sous-comptes client se rattachent à une famille SYSCOHADA existante.
          </p>
        </div>
        <span className="status valid">{syscohadaAccounts.length} comptes</span>
      </section>

      <section className="kpis permissions-grid">
        <article className="card kpi">
          <div className="kpi-title">Seed client</div>
          <div className="kpi-value">{syscohadaAccounts.length}</div>
          <div className="delta neutral">Comptes importés depuis Excel</div>
        </article>
        <article className="card kpi">
          <div className="kpi-title">Sous-compte exemple</div>
          <div className="kpi-value">601001</div>
          <div className="delta good">Rattaché à 601000</div>
        </article>
      </section>

      <section className="card table-card">
        <div className="table-top">
          <div>
            <h3>Recherche “marchandises”</h3>
            <div className="muted">Filtre texte sur code et libellé du référentiel.</div>
          </div>
          <div className="table-actions"><div className="mini-search">marchandises</div><div className="select">Classe : toutes</div></div>
        </div>
        <table>
          <thead><tr><th>Compte</th><th>Libellé</th><th>Classe</th><th>Type</th></tr></thead>
          <tbody>
            {marchandisesAccounts.map((account) => (
              <tr key={account.code}>
                <td>{account.code}</td>
                <td>{account.label}</td>
                <td>{account.class}</td>
                <td><span className="status valid">Standard</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card table-card page-spacer">
        <div className="table-top">
          <div>
            <h3>Filtre classe 1</h3>
            <div className="muted">Capitaux, réserves et assimilés.</div>
          </div>
          <div className="table-actions"><div className="select">Classe : 1</div></div>
        </div>
        <table>
          <thead><tr><th>Compte</th><th>Libellé</th><th>Protection</th></tr></thead>
          <tbody>
            {classOneAccounts.map((account) => (
              <tr key={account.code}>
                <td>{account.code}</td>
                <td>{account.label}</td>
                <td><span className="status draft">Verrou standard si utilisé</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
