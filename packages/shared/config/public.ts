import { getEnvValue } from './getEnvValue';

export const ALCHEMY_ID = getEnvValue(
  'NEXT_PUBLIC_ALCHEMY_ID',
  'missing-alchemy-id',
);

export const MFOS_GRAPHQL_URL = getEnvValue(
  'NEXT_PUBLIC_MFOS_GRAPHQL_URL',
  'http://localhost:8055/graphql',
);
export const FILES_BASE_URL = getEnvValue(
  'NEXT_PUBLIC_FILES_BASE_URL',
  'http://localhost:8055/assets',
);

export const SHOPIFY_URL = getEnvValue(
  'NEXT_PUBLIC_SHOPIFY_URL',
  'https://shop.metafactory.ai',
);

export const IPFS_CLAIMS_SNAPSHOT_URL = getEnvValue(
  'NEXT_PUBLIC_IPFS_CLAIMS_SNAPSHOT_URL',
  '',
);

export const IPFS_NODE = getEnvValue(
  'NEXT_PUBLIC_IPFS_NODE',
  'https://cloudflare-ipfs.com',
);
