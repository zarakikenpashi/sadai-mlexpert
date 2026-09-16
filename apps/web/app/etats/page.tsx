import { buildExportMetadata, buildGeneralBalance, buildGeneralLedger, canExportStates, generateStateExportPayloads } from '@/lib/financial-statements';

const entries = [
  {
    id: 'v1',
    status: 'validated' as const,
    journal: 'ACH',
    date: '2026-09-16',
    lines: [
      { account: '601000', label: 'Achat marchandises', debit: 100000, credit: 0 },
      { account: '401000', label: 'Fournisseur ABC', debit: 0, credit: 100000 }
    ]
  },
  {
    id: 'v2',
    status: 'validated' as const,
    journal: 'VEN',
    date: '2026-09-17',
    lines: [
      { account: '411000', label: 'Client DEF', debit: 250000, credit: 0 },
      { account: '701000', label: 'Vente marchandises', debit: 0, credit: 250000 }
    ]
  },
  {
    id: 'd1',
    status: 'draft' as const,
    journal: 'ACH',
    date: '2026-09-18',
    lines: [
      { account: '601000', label: 'Brouillon exclu', debit: 5000, credit: 0 },
      { account: '401000', label: 'Brouillon exclu', debit: 0, credit: 5000 }
    ]
  }
];

const metadata = buildExportMetadata({
  cabinet: 'Cabinet ABC',
  company: 'Société Alpha',
  fiscalYear: 2026,
  period: '2026-09-01 — 2026-09-30',
  generatedAt: '2026-09-16T22:00:00Z'
});
const balance = buildGeneralBalance({ entries });
const ledger = buildGeneralLedger({ entries });
const exportsReady = generateStateExportPayloads({ entries, metadata });
const canExport = canExportStates({ permissions: ['state:read', 'export:create'] });

export default function Page() {
  return (
    <main className="page-wrap">
      <section className="page-hero">
        <div>
          <p className="eyebrow">États comptables</p>
          <h1>Balance générale et grand livre</h1>
          <p>
            Les états officiels excluent les brouillards, respectent les filtres de période/journal/compte et embarquent
            les métadonnées cabinet, entreprise, exercice, période et date de génération dans chaque export.
          </p>
        </div>
        <span className="status valid">Écart {balance.totals.difference} XOF</span>
      </section>

      <section className="kpis permissions-grid">
        <article className="card kpi">
          <div className="kpi-title">Débit total</div>
          <div className="kpi-value">{balance.totals.debit.toLocaleString('fr-FR')}</div>
          <div className="delta neutral">Balance complète</div>
        </article>
        <article className="card kpi">
          <div className="kpi-title">Crédit total</div>
          <div className="kpi-value">{balance.totals.credit.toLocaleString('fr-FR')}</div>
          <div className="delta good">Équilibrée</div>
        </article>
      </section>

      <section className="card table-card">
        <div className="table-top">
          <div>
            <h3>Balance générale</h3>
            <div className="muted">{metadata.cabinet} · {metadata.company} · exercice {metadata.fiscalYear} · {metadata.period}</div>
          </div>
          <div className="table-actions"><span className="status valid">{canExport ? 'Export autorisé' : 'Export bloqué'}</span></div>
        </div>
        <table>
          <thead><tr><th>Compte</th><th>Libellé</th><th className="num">Débit</th><th className="num">Crédit</th><th className="num">Solde</th></tr></thead>
          <tbody>
            {balance.rows.map((row) => (
              <tr key={row.account}>
                <td>{row.account}</td>
                <td>{row.label}</td>
                <td className="num">{row.debit.toLocaleString('fr-FR')}</td>
                <td className="num">{row.credit.toLocaleString('fr-FR')}</td>
                <td className="num">{row.balance.toLocaleString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card table-card page-spacer">
        <div className="table-top">
          <div>
            <h3>Grand livre par compte</h3>
            <div className="muted">Export Excel : {exportsReady.excel.workbook.sheets.length} feuilles · Export PDF : HTML prêt pour rendu.</div>
          </div>
          <div className="table-actions"><span className="status draft">Généré {metadata.generatedAt}</span></div>
        </div>
        <table>
          <thead><tr><th>Compte</th><th>Mouvements</th><th className="num">Solde clôture</th></tr></thead>
          <tbody>
            {Object.values(ledger).map((account) => (
              <tr key={account.account}>
                <td>{account.account}</td>
                <td>{account.movements.length}</td>
                <td className="num">{account.closingBalance.toLocaleString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
