import apiClient from '../config/axios';

const createResourceApi = (resource) => ({
  list: (params) => apiClient.get(`/${resource}`, { params }),
  get: (id) => apiClient.get(`/${resource}/${id}`),
  create: (data) => apiClient.post(`/${resource}`, data),
  update: (id, data) => apiClient.put(`/${resource}/${id}`, data),
  remove: (id) => apiClient.delete(`/${resource}/${id}`),
});

export const storesApi = createResourceApi('stores');
export const toolsApi = createResourceApi('tools');
export const usersApi = createResourceApi('users');
export const reservationsApi = createResourceApi('reservations');
export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
};
export const installationApi = {
  getStatus: () => apiClient.get('/installation/status'),
  install: (admin) => apiClient.post('/installation', admin),
};

export default {
  stores: storesApi,
  tools: toolsApi,
  users: usersApi,
  reservations: reservationsApi,
  auth: authApi,
  installation: installationApi,
};
