import { GRAPHQL_ADMIN_SECRET, GRAPHQL_URL } from 'shared/config/secret';

import { apiFetch, Thunder } from './__generated__/zeus';

const thunder = Thunder((...params) =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  apiFetch([
    GRAPHQL_URL,
    {
      method: 'POST',
      headers: {
        'x-hasura-admin-secret': GRAPHQL_ADMIN_SECRET,
      },
    },
  ])(...params),
);

export const hasuraClient = {
  query: thunder('query'),
  mutate: thunder('mutation'),
  subscribe: thunder('subscription'),
};
