import { expectedImportHeaders, importRowsAsDraftEntries } from '@/lib/import-excel';

const previewRows = [
  { date: '2026-09-16', journal: 'ACH', piece: 'ACH-001', account: '601000', label: 'Achat marchandises', debit: 100000, credit: 0 },
  { date: '2026-09-16', journal: 'ACH', piece: 'ACH-001', account: '401000', label: 'Fournisseur ABC', debit: 0, credit: 100000 },
  { date: '2026-09-16', journal: 'ACH', piece: 'ACH-002', account: '', label: 'Compte manquant', debit: 5000, credit: 0 }
];

const importPreview = importRowsAsDraftEntries({ rows: previewRows, existingPieces: new Set() });

export default function Page() {
  return (
    <main className="page-wrap">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Import Excel strict</p>
          <h1>Modèle MLexpert sans mapping libre</h1>
          <p>
            Le fichier attendu suit des colonnes fixes. Une erreur rejette l’écriture complète liée à la pièce, et les
            écritures acceptées entrent uniquement en brouillard.
          </p>
        </div>
        <span className="status valid">{expectedImportHeaders.length} colonnes</span>
      </section>

      <section className="kpis permissions-grid">
        <article className="card kpi">
          <div className="kpi-title">Écritures acceptées</div>
          <div className="kpi-value">{importPreview.acceptedEntries.length}</div>
          <div className="delta good">Importées en brouillard</div>
        </article>
        <article className="card kpi">
          <div className="kpi-title">Écritures rejetées</div>
          <div className="kpi-value">{importPreview.rejectedEntries.length}</div>
          <div className="delta warn">Rapport durable</div>
        </article>
      </section>

      <section className="card table-card">
        <div className="table-top">
          <div>
            <h3>Colonnes du modèle strict</h3>
            <div className="muted">Aucune colonne libre ni mapping utilisateur au MVP.</div>
          </div>
          <div className="table-actions"><span className="status draft">.xlsx</span></div>
        </div>
        <table>
          <thead><tr>{expectedImportHeaders.map((header) => <th key={header}>{header}</th>)}</tr></thead>
          <tbody>
            <tr><td>2026-09-16</td><td>ACH</td><td>ACH-001</td><td>601000</td><td>Achat marchandises</td><td className="num">100 000</td><td className="num">0</td></tr>
          </tbody>
        </table>
      </section>

      <section className="card table-card page-spacer">
        <div className="table-top">
          <div>
            <h3>Rapport d’erreurs</h3>
            <div className="muted">Chaque rejet cite la pièce, la ligne et la règle violée.</div>
          </div>
          <div className="table-actions"><span className="status reject">{importPreview.errorReport.errors.length} erreur</span></div>
        </div>
        <table>
          <thead><tr><th>Pièce</th><th>Ligne</th><th>Code</th><th>Message</th></tr></thead>
          <tbody>
            {importPreview.errorReport.errors.map((error) => (
              <tr key={`${error.piece}-${error.rowNumber}-${error.code}`}>
                <td>{error.piece}</td>
                <td>{error.rowNumber}</td>
                <td>{error.code}</td>
                <td>{error.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
