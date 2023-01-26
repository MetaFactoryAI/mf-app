import { getEnvValue } from './getEnvValue';

export const ALCHEMY_ID = getEnvValue(
  process.env.NEXT_PUBLIC_ALCHEMY_ID,
  'missing-alchemy-id',
);

export const MFOS_GRAPHQL_URL = getEnvValue(
  process.env.NEXT_PUBLIC_MFOS_GRAPHQL_URL,
  'http://localhost:8055/graphql',
);
export const FILES_BASE_URL = getEnvValue(
  process.env.NEXT_PUBLIC_FILES_BASE_URL,
  'http://localhost:8055/assets',
);

export const SHOPIFY_URL = getEnvValue(
  process.env.NEXT_PUBLIC_SHOPIFY_URL,
  'https://shop.metafactory.ai',
);
