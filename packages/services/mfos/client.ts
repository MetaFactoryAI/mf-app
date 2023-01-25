import { MFOS_GRAPHQL_URL } from 'shared/config/public';
import { MFOS_GRAPHQL_TOKEN } from 'shared/config/secret';
import { Chain } from './__generated__/user/zeus';

export const mfosClient = Chain(MFOS_GRAPHQL_URL, {
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${MFOS_GRAPHQL_TOKEN}`,
  },
});
