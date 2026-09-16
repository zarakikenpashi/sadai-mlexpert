export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand auth-brand"><div className="mark">ML</div><span>MLexpert</span></div>
        <p className="eyebrow">Accès cabinet</p>
        <h1>Connexion sécurisée</h1>
        <p className="muted">Le MVP utilisera Supabase Auth. Aucun secret n’est stocké côté client.</p>
        <form className="auth-form">
          <label>Email<input placeholder="comptable@cabinet.com" type="email" /></label>
          <label>Mot de passe<input placeholder="••••••••" type="password" /></label>
          <button className="primary" type="button">Se connecter</button>
        </form>
        <p className="muted">Invitation, récupération de mot de passe et désactivation utilisateur seront connectées au lot Auth.</p>
      </section>
    </main>
  );
}
