import { getEnvValue } from './getEnvValue';

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

export const SHOPIFY_API_URL: string = getEnvValue(
  process.env.SHOPIFY_API_URL,
  'https://metafactory.myshopify.com/admin/api/2023-01/graphql.json',
);
export const SHOPIFY_API_TOKEN: string = getEnvValue(
  process.env.SHOPIFY_API_TOKEN,
  'shopify-token',
);

export const INFURA_ID = getEnvValue(process.env.INFURA_ID, '');
export const ALCHEMY_ID = getEnvValue(process.env.ALCHEMY_ID, '');
