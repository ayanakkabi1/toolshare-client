// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../App';
import { installationApi } from '../services/api';

vi.mock('../services/api', () => ({
  installationApi: { getStatus: vi.fn(), install: vi.fn() },
}));

beforeEach(() => {
  window.history.replaceState({}, '', '/installation');
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderInstallation(status = { data: { installed: false } }) {
  installationApi.getStatus.mockResolvedValueOnce(status);
  return render(<App />);
}

function fillForm({ password = 'secure-pass-123', confirmation = password } = {}) {
  fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Aya' } });
  fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Amrani' } });
  fireEvent.change(screen.getByLabelText('Adresse e-mail'), {
    target: { value: 'aya@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Mot de passe', { selector: 'input' }), {
    target: { value: password },
  });
  fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), {
    target: { value: confirmation },
  });
}

describe('installation page', () => {
  it('shows a loading state, then the initial admin form when not installed', async () => {
    let resolveStatus;
    installationApi.getStatus.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveStatus = resolve;
      })
    );
    render(<App />);

    expect(screen.getByRole('status')).toHaveTextContent('Vérification de la configuration');
    resolveStatus({ data: { installed: false } });

    expect(
      await screen.findByRole('heading', { name: 'Bienvenue sur ToolShare' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmer le mot de passe')).toBeInTheDocument();
  });

  it('does not show the form when the app is already installed', async () => {
    renderInstallation({ data: { installed: true } });

    expect(
      await screen.findByRole('heading', { name: 'ToolShare est déjà configuré' })
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Adresse e-mail')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Aller à la connexion' })).toHaveAttribute('href', '/');
    expect(installationApi.install).not.toHaveBeenCalled();
  });

  it('allows retrying when the installation status request fails', async () => {
    installationApi.getStatus.mockRejectedValueOnce(new Error('Network unavailable'));
    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'Configuration indisponible' })
    ).toBeInTheDocument();
    installationApi.getStatus.mockResolvedValueOnce({ data: { installed: false } });
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    expect(
      await screen.findByRole('heading', { name: 'Bienvenue sur ToolShare' })
    ).toBeInTheDocument();
  });

  it('validates fields and password confirmation without calling the API', async () => {
    renderInstallation();
    await screen.findByRole('heading', { name: 'Bienvenue sur ToolShare' });
    fillForm({ confirmation: 'different-password' });
    fireEvent.click(screen.getByRole('button', { name: 'Créer le compte administrateur' }));

    expect(await screen.findByText('Les mots de passe ne correspondent pas.')).toBeInTheDocument();
    expect(installationApi.install).not.toHaveBeenCalled();
  });

  it('creates the admin account, omits confirmation, and shows success', async () => {
    renderInstallation();
    await screen.findByRole('heading', { name: 'Bienvenue sur ToolShare' });
    fillForm();
    installationApi.install.mockResolvedValueOnce({ status: 201, data: { message: 'Created' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer le compte administrateur' }));

    expect(installationApi.install).toHaveBeenCalledWith({
      firstName: 'Aya',
      lastName: 'Amrani',
      email: 'aya@example.com',
      password: 'secure-pass-123',
    });
    expect(
      await screen.findByRole('heading', { name: 'Votre espace est prêt' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Se connecter' })).toHaveAttribute('href', '/');
  });

  it('shows API validation errors beside fields and handles an install race', async () => {
    renderInstallation();
    await screen.findByRole('heading', { name: 'Bienvenue sur ToolShare' });
    fillForm();
    installationApi.install.mockRejectedValueOnce({
      response: {
        status: 422,
        data: {
          message: 'Vérifiez les champs.',
          errors: [{ field: 'email', message: 'Cette adresse est déjà utilisée.' }],
        },
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Créer le compte administrateur' }));

    expect(await screen.findByText('Cette adresse est déjà utilisée.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Vérifiez les champs.');

    installationApi.install.mockRejectedValueOnce({
      response: { status: 409, data: { message: 'Already installed' } },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Créer le compte administrateur' }));

    expect(
      await screen.findByRole('heading', { name: 'ToolShare est déjà configuré' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Aller à la connexion' })).toBeInTheDocument();
  });
});
