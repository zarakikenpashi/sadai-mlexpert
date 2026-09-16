const rows = [
  { label: 'Contexte', value: 'Journaux actifs' },
  { label: 'Statut', value: '8' },
  { label: 'Signal', value: 'Numérotation stricte' }
];

export default function Page() {
  return (
    <main className="page-wrap">
      <section className="page-hero">
        <div>
          <p className="eyebrow">MLexpert MVP</p>
          <h1>Journaux comptables</h1>
          <p>Paramétrage des journaux ACH, VEN, BQ, OD et import.</p>
        </div>
        <span className="status valid">Route prête</span>
      </section>

      <section className="card page-card">
        <div className="table-top">
          <div>
            <h3>Socle fonctionnel</h3>
            <div className="muted">Écran préparé pour branchement Supabase et logique métier du lot dédié.</div>
          </div>
        </div>
        <div className="company-list">
          {rows.map((row) => (
            <div className="company-row" key={row.label}>
              <strong>{row.label}</strong>
              <span>{row.value}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
