import { getEnvValue } from './getEnvValue';

export const GRAPHQL_URL: string = getEnvValue('GRAPHQL_URL');

export const GRAPHQL_ADMIN_SECRET: string = getEnvValue('GRAPHQL_ADMIN_SECRET');

export const MFOS_GRAPHQL_TOKEN = getEnvValue('MFOS_GRAPHQL_TOKEN', '');

export const MFOS_SYSTEM_GRAPHQL_URL = getEnvValue(
  'MFOS_SYSTEM_GRAPHQL_URL',
  'http://localhost:8055/graphql/system',
);

export const LOCKSMITH_ACCESS_TOKEN: string = getEnvValue('LS_ACCESS_TOKEN');
export const LOCKSMITH_ENDPOINT = getEnvValue('LS_ENDPOINT');
export const SHOP_DOMAIN = getEnvValue(
  'SHOP_DOMAIN',
  'metafactory.myshopify.com',
);

export const INFURA_ID = getEnvValue('INFURA_ID', '');
export const ALCHEMY_ID = getEnvValue('ALCHEMY_ID', '');
