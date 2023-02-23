import { getEnvValue } from './getEnvValue';

export const GRAPHQL_URL: string = getEnvValue(
  process.env.GRAPHQL_URL,
  'http://localhost:8055/graphql',
);

export const GRAPHQL_ADMIN_SECRET: string = getEnvValue(
  process.env.GRAPHQL_ADMIN_SECRET,
  '',
);

export const MFOS_GRAPHQL_TOKEN = getEnvValue(
  process.env.MFOS_GRAPHQL_TOKEN,
  '',
);

export const MFOS_SYSTEM_GRAPHQL_URL = getEnvValue(
  process.env.MFOS_SYSTEM_GRAPHQL_URL,
  'http://localhost:8055/graphql/system',
);

export const LOCKSMITH_ACCESS_TOKEN: string = getEnvValue(
  process.env.LS_ACCESS_TOKEN,
  '',
);
export const LOCKSMITH_ENDPOINT = getEnvValue(process.env.LS_ENDPOINT, '');
export const SHOP_DOMAIN = getEnvValue(
  process.env.SHOP_DOMAIN,
  'metafactory.myshopify.com',
);

export const INFURA_ID = getEnvValue(process.env.INFURA_ID, '');
export const ALCHEMY_ID = getEnvValue(process.env.ALCHEMY_ID, '');
