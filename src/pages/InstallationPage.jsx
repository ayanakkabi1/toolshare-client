import { useEffect, useRef, useState } from 'react';
import { installationApi } from '../services/api';

const fieldLabels = {
  firstName: 'Prénom',
  first_name: 'Prénom',
  lastName: 'Nom',
  last_name: 'Nom',
  email: 'Adresse e-mail',
  password: 'Mot de passe',
};

function getApiErrors(error) {
  const errors = error.response?.data?.errors;
  if (!errors) return {};

  if (Array.isArray(errors)) {
    return errors.reduce((result, item) => {
      if (typeof item === 'string') {
        result.general = [...(result.general || []), item];
      } else if (item && typeof item === 'object') {
        const key = item.field || item.path || item.param;
        const message = item.message || item.msg;
        const field = fieldLabels[key] ? key : 'general';
        if (message) result[field] = [...(result[field] || []), message];
      }
      return result;
    }, {});
  }

  if (errors && typeof errors === 'object') {
    return Object.entries(errors).reduce((result, [key, value]) => {
      const field = fieldLabels[key] ? key : 'general';
      const messages = Array.isArray(value) ? value : [value];
      result[field] = messages
        .map((item) => (typeof item === 'string' ? item : item?.message || item?.msg || ''))
        .filter(Boolean);
      return result;
    }, {});
  }

  return {};
}

function alreadyInstalled(error) {
  if (error.response?.status === 409 || error.response?.data?.installed === true) return true;
  const details = `${error.response?.data?.message || ''} ${JSON.stringify(error.response?.data?.errors || {})}`;
  return /already\s+(?:been\s+)?(?:installed|configured)|déjà\s+(?:installée|configurée|initialisée)/i.test(
    details
  );
}

async function fetchInstallationState() {
  try {
    const { data } = await installationApi.getStatus();
    return data.installed ? 'installed' : 'ready';
  } catch {
    return 'unavailable';
  }
}

export default function InstallationPage() {
  const [installationState, setInstallationState] = useState('loading');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmation: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    fetchInstallationState().then(setInstallationState);
  }, []);

  const retryInstallationCheck = async () => {
    setInstallationState('loading');
    setFormError('');
    setInstallationState(await fetchInstallationState());
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;
    setFieldErrors({});
    setFormError('');

    const validationErrors = {};
    if (!form.firstName.trim()) validationErrors.firstName = ['Le prénom est obligatoire.'];
    if (!form.lastName.trim()) validationErrors.lastName = ['Le nom est obligatoire.'];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      validationErrors.email = ['Saisissez une adresse e-mail valide.'];
    }
    if (form.password.length < 8) {
      validationErrors.password = ['Le mot de passe doit contenir au moins 8 caractères.'];
    }
    if (!form.confirmation) {
      validationErrors.confirmation = ['Confirmez votre mot de passe.'];
    } else if (form.password !== form.confirmation) {
      validationErrors.confirmation = ['Les mots de passe ne correspondent pas.'];
    }
    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors);
      return;
    }

    submittingRef.current = true;
    setInstallationState('submitting');
    try {
      await installationApi.install({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setForm({ firstName: '', lastName: '', email: '', password: '', confirmation: '' });
      setInstallationState('success');
    } catch (error) {
      if (alreadyInstalled(error)) {
        setInstallationState('installed');
        return;
      }

      const errors = getApiErrors(error);
      setFieldErrors(errors);
      setFormError(
        error.response?.data?.message ||
          (Object.keys(errors).length
            ? 'Vérifiez les informations indiquées ci-dessous.'
            : 'La création du compte a échoué. Vérifiez votre connexion puis réessayez.')
      );
      setInstallationState('ready');
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <main className="installation-page">
      <section className="installation-card" aria-labelledby="installation-title">
        <a className="brand installation-brand" href="/" aria-label="ToolShare, accueil">
          <span className="installation-brand__mark" aria-hidden="true">
            T
          </span>
          <span className="brand__name">
            ToolShare<span className="brand__period">.</span>
          </span>
        </a>

        {installationState === 'loading' && (
          <div className="installation-state" role="status" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            <p>Vérification de la configuration…</p>
          </div>
        )}

        {installationState === 'unavailable' && (
          <div className="installation-state" role="alert">
            <h1 id="installation-title">Configuration indisponible</h1>
            <p>
              Nous ne pouvons pas vérifier l’installation pour le moment. Vérifiez votre connexion
              puis réessayez.
            </p>
            <button className="installation-button" type="button" onClick={retryInstallationCheck}>
              Réessayer
            </button>
          </div>
        )}

        {installationState === 'installed' && (
          <div className="installation-state" role="status">
            <span className="installation-state__icon" aria-hidden="true">
              ✓
            </span>
            <h1 id="installation-title">ToolShare est déjà configuré</h1>
            <p>
              Le compte administrateur initial a déjà été créé. Vous pouvez vous connecter pour
              continuer.
            </p>
            <a className="installation-button" href="/">
              Aller à la connexion
            </a>
          </div>
        )}

        {installationState === 'success' && (
          <div className="installation-state" role="status">
            <span className="installation-state__icon" aria-hidden="true">
              ✓
            </span>
            <h1 id="installation-title">Votre espace est prêt</h1>
            <p>
              Le compte administrateur ToolShare a bien été créé. Vous pouvez maintenant vous
              connecter.
            </p>
            <a className="installation-button" href="/">
              Se connecter
            </a>
          </div>
        )}

        {(installationState === 'ready' || installationState === 'submitting') && (
          <>
            <header className="installation-heading">
              <span className="eyebrow eyebrow--purple">Première configuration</span>
              <h1 id="installation-title">Bienvenue sur ToolShare</h1>
              <p>
                Créez le compte administrateur initial pour commencer à partager et réserver du
                matériel.
              </p>
            </header>

            <form className="installation-form" onSubmit={handleSubmit} noValidate>
              <div className="installation-form__names">
                <Field
                  label="Prénom"
                  name="firstName"
                  value={form.firstName}
                  onChange={updateField}
                  error={fieldErrors.firstName || fieldErrors.first_name}
                  required
                  disabled={installationState === 'submitting'}
                  autoComplete="given-name"
                />
                <Field
                  label="Nom"
                  name="lastName"
                  value={form.lastName}
                  onChange={updateField}
                  error={fieldErrors.lastName || fieldErrors.last_name}
                  required
                  disabled={installationState === 'submitting'}
                  autoComplete="family-name"
                />
              </div>
              <Field
                label="Adresse e-mail"
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                error={fieldErrors.email}
                required
                disabled={installationState === 'submitting'}
                autoComplete="email"
              />
              <Field
                label="Mot de passe"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={updateField}
                error={fieldErrors.password}
                required
                disabled={installationState === 'submitting'}
                autoComplete="new-password"
                minLength={8}
              >
                <button
                  className="installation-password-toggle"
                  type="button"
                  disabled={installationState === 'submitting'}
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? 'Masquer' : 'Afficher'}
                </button>
              </Field>
              <Field
                label="Confirmer le mot de passe"
                name="confirmation"
                type="password"
                value={form.confirmation}
                onChange={updateField}
                error={fieldErrors.confirmation}
                required
                disabled={installationState === 'submitting'}
                autoComplete="new-password"
              />

              {formError && (
                <p className="installation-form__error" role="alert">
                  {formError}
                </p>
              )}
              {fieldErrors.general?.map((message, index) => (
                <p className="installation-form__error" role="alert" key={`${message}-${index}`}>
                  {message}
                </p>
              ))}

              <button
                className="installation-button installation-button--full"
                type="submit"
                disabled={installationState === 'submitting'}
              >
                {installationState === 'submitting' ? (
                  <>
                    <span className="spinner spinner--light" aria-hidden="true" /> Création du
                    compte…
                  </>
                ) : (
                  'Créer le compte administrateur'
                )}
              </button>
            </form>
            <p className="installation-note">
              Cette étape ne peut être effectuée qu’une seule fois.
            </p>
          </>
        )}
      </section>
    </main>
  );
}

function Field({ label, name, value, onChange, error, children, ...inputProps }) {
  const errorId = `${name}-error`;
  return (
    <div className="installation-field">
      <label htmlFor={name}>{label}</label>
      <div className="installation-field__control">
        <input
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
        />
        {children}
      </div>
      {error && (
        <p className="installation-field__error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}
