const createResourceKeys = (resource) => ({
  all: [resource],
  lists: () => [resource, 'list'],
  list: (filters = {}) => [resource, 'list', filters],
  details: () => [resource, 'detail'],
  detail: (id) => [resource, 'detail', id],
});

export const queryKeys = {
  tools: createResourceKeys('tools'),
  categories: createResourceKeys('categories'),
  reservations: createResourceKeys('reservations'),
  users: createResourceKeys('users'),
};

export default queryKeys;
