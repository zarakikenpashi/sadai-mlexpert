import { createDraftEntry, createReversalEntry, filterOfficialEntries, validateEntry } from '@/lib/accounting';

const draft = createDraftEntry({
  id: 'BR-2026-0001',
  label: 'Facture fournisseur ABC',
  lines: [
    { account: '601000', label: 'Achat marchandises', debit: 100000, credit: 0 },
    { account: '401000', label: 'Fournisseur ABC', debit: 0, credit: 100000 }
  ]
});

const validated = validateEntry({ entry: draft, validatedAt: new Date('2026-09-16T10:00:00Z') });
const reversal = createReversalEntry({ entry: validated, id: 'EXT-2026-0001', createdAt: new Date('2026-09-17T10:00:00Z') });
const officialEntries = filterOfficialEntries([draft, validated]);

export default function Page() {
  return (
    <main className="page-wrap">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Saisie comptable</p>
          <h1>Brouillard, validation, contrepassation</h1>
          <p>
            La saisie contrôle les totaux débit/crédit avant validation. Une écriture validée devient immuable ; toute
            correction passe par une contrepassation liée à l’écriture d’origine.
          </p>
        </div>
        <span className="status valid">Écart {draft.totals.difference} XOF</span>
      </section>

      <section className="kpis permissions-grid">
        <article className="card kpi">
          <div className="kpi-title">Débit brouillard</div>
          <div className="kpi-value">{draft.totals.debit.toLocaleString('fr-FR')}</div>
          <div className="delta neutral">Contrôle temps réel</div>
        </article>
        <article className="card kpi">
          <div className="kpi-title">Crédit brouillard</div>
          <div className="kpi-value">{draft.totals.credit.toLocaleString('fr-FR')}</div>
          <div className="delta good">Écriture équilibrée</div>
        </article>
      </section>

      <section className="card table-card">
        <div className="table-top">
          <div>
            <h3>Lignes de saisie</h3>
            <div className="muted">Une ligne porte soit un débit, soit un crédit, jamais les deux.</div>
          </div>
          <div className="table-actions"><span className="status draft">Brouillard</span><span className="status valid">Validable</span></div>
        </div>
        <table>
          <thead><tr><th>Compte</th><th>Libellé</th><th className="num">Débit</th><th className="num">Crédit</th></tr></thead>
          <tbody>
            {draft.lines.map((line) => (
              <tr key={`${line.account}-${line.label}`}>
                <td>{line.account}</td>
                <td>{line.label}</td>
                <td className="num">{line.debit ? line.debit.toLocaleString('fr-FR') : '—'}</td>
                <td className="num">{line.credit ? line.credit.toLocaleString('fr-FR') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card table-card page-spacer">
        <div className="table-top">
          <div>
            <h3>Cycle de validation</h3>
            <div className="muted">Les états officiels excluent les brouillards et conservent les écritures validées.</div>
          </div>
          <div className="table-actions"><span className="status valid">{officialEntries.length} état officiel</span></div>
        </div>
        <table>
          <thead><tr><th>Pièce</th><th>Statut</th><th>Lien</th><th className="num">Écart</th></tr></thead>
          <tbody>
            <tr><td>{validated.id}</td><td><span className="status valid">Validée immuable</span></td><td>—</td><td className="num">{validated.totals.difference}</td></tr>
            <tr><td>{reversal.id}</td><td><span className="status draft">Contrepassation brouillon</span></td><td>{reversal.reversalOfEntryId}</td><td className="num">{reversal.totals.difference}</td></tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}
