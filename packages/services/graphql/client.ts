import { CONFIG } from '../utils/config';
import { apiFetch, Thunder } from './__generated__/zeus';

const thunder = Thunder((...params) =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
