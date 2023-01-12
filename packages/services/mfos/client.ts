import { parseEnv } from '../utils/config';
import { createClient } from './index';

export const mfosGraphqlUrl = parseEnv(
  process.env.MFOS_GRAPHQL_URL,
  'http://localhost:8055/graphql',
);
const mfosGraphqlToken = parseEnv(process.env.MFOS_GRAPHQL_TOKEN, '');

export const mfosClient = createClient(mfosGraphqlUrl, mfosGraphqlToken);
