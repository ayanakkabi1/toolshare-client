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

export default {
  stores: storesApi,
  tools: toolsApi,
  users: usersApi,
  reservations: reservationsApi,
};
