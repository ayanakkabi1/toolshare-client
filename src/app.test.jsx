// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import App from './App';
import { authenticate } from './services/auth';

vi.mock('./services/auth', () => ({
  authenticate: vi.fn(),
  normalizeRole: vi.fn((role) => role || 'user'),
  roleDestinations: { admin: '/admin', owner: '/owner', user: '/dashboard' },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.history.replaceState({}, '', '/');
});

const fillLoginForm = () => {
  fireEvent.change(screen.getByLabelText('Adresse e-mail'), {
    target: { value: 'aya@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Mot de passe'), {
    target: { value: 'secure-password' },
  });
};

describe('login form', () => {
  it('submits entered credentials and shows success feedback', async () => {
    authenticate.mockResolvedValueOnce({ destination: '/owner' });
    render(<App />);

    fillLoginForm();
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(authenticate).toHaveBeenCalledWith({
      email: 'aya@example.com',
      password: 'secure-password',
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Connexion réussie. Votre espace se prépare…'
    );
  });

  it('shows an authentication error and allows the user to edit the form', async () => {
    authenticate.mockRejectedValueOnce({
      response: { data: { message: 'Adresse e-mail ou mot de passe invalide.' } },
    });
    render(<App />);

    fillLoginForm();
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Adresse e-mail ou mot de passe invalide.'
    );
    fireEvent.change(screen.getByLabelText('Adresse e-mail'), {
      target: { value: 'new@example.com' },
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    render(<App />);
    const password = screen.getByLabelText('Mot de passe');

    expect(password).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByRole('button', { name: 'Afficher le mot de passe' }));
    expect(password).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByRole('button', { name: 'Masquer le mot de passe' }));
    expect(password).toHaveAttribute('type', 'password');
  });
});
