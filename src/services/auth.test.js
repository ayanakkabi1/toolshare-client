import { describe, expect, it, vi } from 'vitest';
import { authenticate, getAuthSession, normalizeRole, roleDestinations } from './auth';

const createStorage = () => ({ setItem: vi.fn() });

describe('normalizeRole', () => {
  it.each([
    ['admin', 'admin'],
    ['Administrateur', 'admin'],
    ['administrator', 'admin'],
    ['owner', 'owner'],
    ['Propriétaire', 'owner'],
    ['proprietor', 'owner'],
    ['member', 'user'],
    ['', 'user'],
  ])('maps "%s" to the "%s" role', (input, expected) => {
    expect(normalizeRole(input)).toBe(expected);
  });
});

describe('getAuthSession', () => {
  it('normalizes a nested API response and reads the token and user role', () => {
    expect(
      getAuthSession({
        data: {
          access_token: 'access-123',
          utilisateur: { id: 7, name: 'Aya', type: 'Propriétaire' },
        },
      }),
    ).toEqual({
      token: 'access-123',
      user: { id: 7, name: 'Aya', type: 'Propriétaire', role: 'owner' },
      role: 'owner',
      destination: '/owner',
    });
  });

  it('uses the top-level role when the response has no user role', () => {
    expect(getAuthSession({ token: 'admin-token', role: 'ADMIN' })).toEqual({
      token: 'admin-token',
      user: { role: 'admin' },
      role: 'admin',
      destination: '/admin',
    });
  });

  it('defaults unknown roles to the regular user space', () => {
    expect(getAuthSession({ user: { role: 'volunteer' } })).toMatchObject({
      role: 'user',
      destination: roleDestinations.user,
    });
  });
});

describe('authenticate', () => {
  it('sends credentials and persists the token, user, and role destination', async () => {
    const credentials = { email: 'aya@example.com', password: 'secure-password' };
    const api = {
      login: vi.fn().mockResolvedValue({
        data: { token: 'owner-token', user: { id: 7, name: 'Aya', role: 'owner' } },
      }),
    };
    const storage = createStorage();
    const redirectStorage = createStorage();

    const session = await authenticate(credentials, { api, storage, redirectStorage });

    expect(api.login).toHaveBeenCalledOnce();
    expect(api.login).toHaveBeenCalledWith(credentials);
    expect(storage.setItem).toHaveBeenCalledWith('accessToken', 'owner-token');
    expect(storage.setItem).toHaveBeenCalledWith(
      'toolshare:user',
      JSON.stringify({ id: 7, name: 'Aya', role: 'owner' }),
    );
    expect(redirectStorage.setItem).toHaveBeenCalledWith('toolshare:redirect', '/owner');
    expect(session).toMatchObject({ role: 'owner', destination: '/owner' });
  });

  it('propagates API errors without persisting a session', async () => {
    const error = new Error('Invalid credentials');
    const api = { login: vi.fn().mockRejectedValue(error) };
    const storage = createStorage();
    const redirectStorage = createStorage();

    await expect(
      authenticate({ email: 'bad@example.com', password: 'bad' }, { api, storage, redirectStorage }),
    ).rejects.toBe(error);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(redirectStorage.setItem).not.toHaveBeenCalled();
  });
});
