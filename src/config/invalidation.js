import { queryKeys } from './queryKeys';

const resourceKeys = {
  tools: queryKeys.tools.all,
  categories: queryKeys.categories.all,
  reservations: queryKeys.reservations.all,
  users: queryKeys.users.all,
};

export const invalidateResource = (client, resource) => {
  const queryKey = resourceKeys[resource];

  if (!queryKey) {
    throw new Error(`Unknown query resource: ${resource}`);
  }

  return client.invalidateQueries({ queryKey });
};

export const invalidateResources = (client, resources) =>
  Promise.all(resources.map((resource) => invalidateResource(client, resource)));
