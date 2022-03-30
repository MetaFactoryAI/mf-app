import { CONFIG } from '../utils/config';
import { apiFetch, Thunder } from './__generated__/zeus';

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
const thunder = Thunder((...params) =>
  apiFetch([
    CONFIG.graphqlURL,
    {
      method: 'POST',
      headers: {
        'x-hasura-admin-secret': CONFIG.graphqlAdminSecret,
      },
    },
  ])(...params),
);

export const client = {
  query: thunder('query'),
  mutate: thunder('mutation'),
  subscribe: thunder('subscription'),
};
