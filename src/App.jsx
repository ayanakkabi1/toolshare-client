import { useEffect, useState } from 'react';
import { authenticate, normalizeRole, roleDestinations } from './services/auth';
import InstallationPage from './pages/InstallationPage';

const routeRoles = Object.fromEntries(Object.entries(roleDestinations).map(([role, path]) => [path, role]));

function ToolshareLogo({ light = false }) {
  return (
    <a className={`brand${light ? ' brand--light' : ''}`} href="/" aria-label="Toolshare, accueil">
      <svg className="brand__symbol" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M22.8 4.5a19.2 19.2 0 1 0 19.2 19.2" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M11.5 14.5h24M23.5 14.5v26" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M33 23c-2.2-4.6-10.5-4.4-11.3.3-.9 5.5 11.8 4.3 11.1 10.1-.6 4.7-7.6 6.3-12.6 2.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path d="M33 5.5a22 22 0 0 1 9 16" stroke="var(--brand-mint)" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="42.2" cy="21.5" r="3.5" fill="var(--brand-mint)" />
      </svg>
      <span className="brand__name">ToolShare<span className="brand__period">.</span></span>
    </a>
  );
}

function RoleSpace({ role }) {
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('toolshare:user') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const savedRole = normalizeRole(user.role || user.type);
    if (!localStorage.getItem('accessToken')) {
      window.location.replace('/');
    } else if (savedRole && savedRole !== role) {
      window.location.replace(roleDestinations[savedRole] || '/dashboard');
    }
  }, [role, user.role]);

  const roleLabels = { admin: 'Administration', owner: 'Espace propriétaire', user: 'Mon espace' };
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('toolshare:user');
    window.location.assign('/');
  };

  return (
    <main className="role-space">
      <header className="role-space__header">
        <ToolshareLogo />
        <button className="logout-button" type="button" onClick={handleLogout}>Se déconnecter</button>
      </header>
      <section className="role-space__content">
        <span className="eyebrow eyebrow--purple">{roleLabels[role]}</span>
        <h1>Bonjour{user.name || user.prenom ? `, ${user.name || user.prenom}` : ''} !</h1>
        <p>Bienvenue dans votre espace Toolshare.</p>
        <div className="role-space__card"><span className="role-space__icon">✦</span><div><strong>Votre espace est prêt</strong><p>Les outils et activités liés à votre compte apparaîtront ici.</p></div></div>
      </section>
    </main>
  );
}

function App() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (status !== 'success') return undefined;

    const destination = sessionStorage.getItem('toolshare:redirect') || '/dashboard';
    const timer = window.setTimeout(() => {
      sessionStorage.removeItem('toolshare:redirect');
      window.location.assign(destination);
    }, 900);

    return () => window.clearTimeout(timer);
  }, [status]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    if (status === 'error') setStatus('idle');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      await authenticate(form);
      setMessage('Connexion réussie. Votre espace se prépare…');
      setStatus('success');
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Identifiants incorrects ou service indisponible. Réessayez.',
      );
      setStatus('error');
    }
  };

  const isBusy = status === 'loading' || status === 'success';
  const activeRole = routeRoles[window.location.pathname];

  if (window.location.pathname === '/installation') return <InstallationPage />;
  if (activeRole) return <RoleSpace role={activeRole} />;

  return (
    <main className="login-page">
      <section className="login-story" aria-label="À propos de Toolshare">
        <ToolshareLogo light />

        <div className="story-copy">
          <span className="eyebrow">Le partage, tout simplement</span>
          <h1>Les bons outils<br />au bon moment.</h1>
          <p>Retrouvez votre communauté, partagez vos outils et donnez vie à vos projets.</p>
        </div>

        <div className="story-art" aria-hidden="true">
          <div className="art-orbit art-orbit--one" />
          <div className="art-orbit art-orbit--two" />
          <div className="tool-card tool-card--drill">
            <svg viewBox="0 0 100 100" fill="none">
              <path d="M17 35h45a13 13 0 0 1 0 26H17V35Z" fill="#27524B" />
              <path d="M62 42h17a7 7 0 0 1 0 14H62V42Z" fill="#8FB8AE" />
              <path d="m28 61 7 25h20l-5-25H28Z" fill="#4D7B73" />
              <path d="M17 43H8v10h9M78 46h13v4H78" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="36" cy="48" r="4" fill="#DCEBE6" />
            </svg>
          </div>
          <div className="tool-card tool-card--plant">
            <svg viewBox="0 0 100 100" fill="none">
              <path d="M49 66V34m0 21c0-16-12-22-25-21 1 14 8 24 25 24Zm0-11c1-16 13-22 26-21-1 14-9 24-26 24Z" stroke="#4D7B73" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M30 67h40l-5 22H35l-5-22Z" fill="#8FB8AE" />
              <path d="M27 66h46" stroke="#27524B" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="tool-card tool-card--saw">
            <svg viewBox="0 0 100 100" fill="none">
              <path d="m20 69 48-48 13 13-48 48H20V69Z" fill="#4D7B73" />
              <path d="m63 26 12 12M25 69l7 7M37 57l7 7M49 45l7 7" stroke="#DCEBE6" strokeWidth="5" strokeLinecap="round" />
              <path d="M20 68h22" stroke="#27524B" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="art-spark art-spark--one">✳</div>
          <div className="art-spark art-spark--two">✳</div>
        </div>

        <div className="story-footer"><span className="footer-dot" /> Ensemble, on va plus loin.</div>
      </section>

      <section className="login-panel">
        <div className="brand--mobile"><ToolshareLogo /></div>
        <div className="login-card">
          <div className="login-heading">
            <span className="eyebrow eyebrow--purple">Bon retour parmi nous</span>
            <h2>Connectez-vous</h2>
            <p>Accédez à votre espace Toolshare.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Adresse e-mail</label>
            <div className="input-wrap">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.7" /><path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="vous@exemple.com"
                value={form.email}
                onChange={handleChange}
                required
                disabled={isBusy}
              />
            </div>

            <div className="password-label-row">
              <label htmlFor="password">Mot de passe</label>
              <a href="/mot-de-passe-oublie">Mot de passe oublié ?</a>
            </div>
            <div className="input-wrap">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.7" /><path d="M8 10V7a4 4 0 1 1 8 0v3m-4 4v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Votre mot de passe"
                value={form.password}
                onChange={handleChange}
                required
                disabled={isBusy}
              />
              <button className="password-toggle" type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                {showPassword ? 'Masquer' : 'Afficher'}
              </button>
            </div>

            {message && (
              <p className={`form-status form-status--${status}`} role={status === 'error' ? 'alert' : 'status'}>
                {status === 'loading' && <span className="spinner" aria-hidden="true" />}
                {status === 'success' && <span aria-hidden="true">✓</span>}
                {message}
              </p>
            )}

            <button className="submit-button" type="submit" disabled={isBusy}>
              {status === 'loading' ? <><span className="spinner spinner--light" /> Connexion en cours…</> : status === 'success' ? 'Connexion réussie' : 'Se connecter'}
              {status === 'idle' && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className="signup-prompt">Pas encore de compte ? <a href="/inscription">Créer un compte</a></p>
          <div className="secure-note"><span aria-hidden="true">✦</span> Vos données restent protégées et privées.</div>
        </div>
        <footer className="panel-footer">© 2026 Toolshare <span>·</span> Fait pour partager.</footer>
      </section>
    </main>
  );
}

export default App;
