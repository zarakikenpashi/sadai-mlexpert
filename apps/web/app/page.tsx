import { isBalanced, totals, type EntryLine } from '@/lib/accounting';

const lines: EntryLine[] = [
  { account: '601000', label: 'Achat marchandises', debit: 100000, credit: 0 },
  { account: '401000', label: 'Fournisseur ABC', debit: 0, credit: 100000 }
];
const total = totals(lines);
const balanced = isBalanced(lines);

export default function Page() {
  return (
    <main className="shell">
      <div className="chrome"><span className="dot red"/><span className="dot yellow"/><span className="dot green"/><span className="chrome-title">MLexpert — Tableau de bord cabinet</span></div>
      <header>
        <div className="brand"><div className="mark">ML</div><span>MLexpert</span></div>
        <nav className="nav" aria-label="Navigation principale"><span>Tableau de bord</span><span>Saisie</span><span>États</span><span>Import</span><span>Administration</span></nav>
        <div className="top-actions"><div className="search">⌕ Rechercher…</div><div className="icon">🔔</div><div className="avatar"><div className="avatar-badge">AD</div><div><b>A. Diallo</b><small>Admin cabinet</small></div></div></div>
      </header>
      <div className="grid">
        <aside className="menu"><div className="menu-title">Cabinet ABC</div>{['Tableau de bord','Abonnement','Entreprises','Exercices','Plan comptable','Journaux','Saisie comptable','Import Excel','États comptables','Administration'].map((item, index)=><div className={`menu-item ${index===0?'active':''}`} key={item}><span className="mi">{index===0?'▦':'●'}</span>{item}</div>)}</aside>
        <section>
          <div className="context"><div><strong>Tableau de bord cabinet</strong> · Société Alpha · Exercice 2026 · Devise XOF</div><div className="pill">● Abonnement actif</div></div>
          <div className="kpis">
            <article className="card kpi"><div className="kpi-title">Entreprises clientes</div><div className="kpi-value">24</div><div className="delta good">↗ +3 ce mois</div></article>
            <article className="card kpi"><div className="kpi-title">Écritures brouillard</div><div className="kpi-value">132</div><div className="delta warn">● à contrôler</div></article>
            <article className="card kpi"><div className="kpi-title">Écart de saisie</div><div className="kpi-value">{total.debit-total.credit} XOF</div><div className="delta good">✓ {balanced ? 'équilibré' : 'à corriger'}</div></article>
            <article className="card kpi"><div className="kpi-title">Pièces jointes</div><div className="kpi-value">418</div><div className="delta neutral">PDF/JPG/PNG</div></article>
          </div>
          <div className="analytics">
            <article className="card chart-card"><div className="card-head"><div><h2>Santé comptable</h2><div className="muted">Écritures validées, brouillards et imports — 7 derniers jours</div></div><div className="tabs"><span>1J</span><span>7J</span><span className="active">1M</span><span>1A</span></div></div><div className="chart"><svg viewBox="0 0 620 178" preserveAspectRatio="none"><polyline points="0,142 55,126 95,132 130,92 180,110 220,74 270,92 315,68 360,78 405,52 455,72 505,44 560,62 620,38" fill="none" stroke="#ff6b3d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><polyline points="0,154 65,144 120,148 180,128 240,137 300,118 360,128 430,102 500,112 620,94" fill="none" stroke="#12b76a" strokeWidth="2" opacity=".7" strokeLinecap="round"/></svg><div className="tooltip">16 sept. 2026<strong>248 écritures</strong><span>0 écart détecté</span></div></div><div className="months"><span>Lun</span><span>Mar</span><span>Mer</span><span>Jeu</span><span>Ven</span><span>Sam</span><span>Dim</span></div></article>
            <article className="card balance-card"><div className="card-head"><div><h3>Balance rapide</h3><div className="muted">Société Alpha</div></div></div><div className="balance-row"><span>Débit total</span><span className="amount">12 450 000</span></div><div className="balance-row"><span>Crédit total</span><span className="amount">12 450 000</span></div><div className="balance-row"><span>Écart</span><span className="amount good">0 XOF</span></div><div className="balance-row"><span>État</span><span className="status valid">✓ équilibrée</span></div></article>
          </div>
          <article className="card table-card"><div className="table-top"><div><h3>Écritures récentes</h3><div className="muted">Dernières opérations sur l’exercice actif</div></div><div className="table-actions"><div className="mini-search">Recherche</div><div className="select">Journal : tous</div><div className="select">24H</div></div></div><table><thead><tr><th>Date</th><th>Journal</th><th>Pièce</th><th>Libellé</th><th className="num">Débit</th><th className="num">Crédit</th><th>Statut</th></tr></thead><tbody><tr><td>16/09/26</td><td>ACH</td><td>ACH-2026-09-0001</td><td>Facture fournisseur ABC</td><td className="num">100 000</td><td className="num">100 000</td><td><span className="status valid">Validée</span></td></tr><tr><td>16/09/26</td><td>BQ</td><td>BQ-2026-09-0018</td><td>Règlement client</td><td className="num">120 000</td><td className="num">120 000</td><td><span className="status draft">Brouillard</span></td></tr><tr><td>14/09/26</td><td>IMP</td><td>LOT-00042</td><td>Import Excel ventes</td><td className="num">—</td><td className="num">—</td><td><span className="status reject">Rejeté</span></td></tr></tbody></table></article>
        </section>
        <aside className="panel"><div className="panel-section"><div className="panel-title">Contexte actif</div><div className="asset"><div className="asset-icon blue">C</div><div><b>Cabinet ABC</b><div className="muted">Formule Cabinet Pro</div></div><span className="status valid">Actif</span></div><div className="asset"><div className="asset-icon emerald">S</div><div><b>Société Alpha</b><div className="muted">Exercice 2026</div></div></div></div><div className="panel-section"><div className="panel-title">Actions rapides</div><div className="quick"><button className="primary">+ Écriture</button><button className="secondary">Importer</button><button className="secondary">Balance</button><button className="secondary">Grand livre</button></div></div><div className="panel-section"><div className="panel-title">Alertes</div><div className="alert">⚠️ <span><b>12 brouillards</b><br/>à valider avant clôture.</span></div><div className="alert">⛔ <span><b>3 lignes import</b><br/>rejetées pour compte inexistant.</span></div></div></aside>
      </div>
    </main>
  );
}
