import { authApi } from './api';

export const roleDestinations = {
  admin: '/admin',
  owner: '/owner',
  user: '/dashboard',
};

export function normalizeRole(value = '') {
  const normalized = String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (['admin', 'administrateur', 'administrator'].includes(normalized)) return 'admin';
  if (['owner', 'proprietaire', 'proprietor'].includes(normalized)) return 'owner';
  return 'user';
}

function removeSecrets(user) {
  const safeUser = { ...user };
  for (const key of Object.keys(safeUser)) {
    if (/password|token|secret|credential/i.test(key)) delete safeUser[key];
  }
  return safeUser;
}

export function getAuthSession(responseData) {
  const data = responseData?.data || responseData || {};
  const responseUser = data.user || data.utilisateur || {};
  const role = normalizeRole(responseUser.role || data.role || responseUser.type);
  const user = { ...removeSecrets(responseUser), role };

  return {
    token: data.accessToken || data.token || data.access_token,
    user,
    role,
    destination: roleDestinations[role],
  };
}

export async function authenticate(
  credentials,
  { api = authApi, storage = globalThis.localStorage, redirectStorage = globalThis.sessionStorage } = {},
) {
  const { data } = await api.login(credentials);
  const session = getAuthSession(data);

  if (session.token) storage.setItem('accessToken', session.token);
  storage.setItem('toolshare:user', JSON.stringify(session.user));
  redirectStorage.setItem('toolshare:redirect', session.destination);

  return session;
}
