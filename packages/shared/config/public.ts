import { getEnvValue } from './getEnvValue';

export const ALCHEMY_ID = getEnvValue(
  process.env.NEXT_PUBLIC_ALCHEMY_ID,
  'missing-alchemy-id',
);

export const MFOS_URL = getEnvValue(
  process.env.NEXT_PUBLIC_MFOS_URL,
  'http://localhost:8055',
);

export const MFOS_GRAPHQL_URL = getEnvValue(
  process.env.NEXT_PUBLIC_MFOS_GRAPHQL_URL,
  `${MFOS_URL}/graphql`,
);
export const FILES_BASE_URL = getEnvValue(
  process.env.NEXT_PUBLIC_FILES_BASE_URL,
  `${MFOS_URL}/assets`,
);

export const SHOPIFY_URL = getEnvValue(
  process.env.NEXT_PUBLIC_SHOPIFY_URL,
  'https://shop.metafactory.ai',
);

export const IPFS_CLAIMS_SNAPSHOT_URL = getEnvValue(
  process.env.NEXT_PUBLIC_IPFS_CLAIMS_SNAPSHOT_URL,
  '',
);

export const IPFS_NODE = getEnvValue(
  process.env.NEXT_PUBLIC_IPFS_NODE,
  'https://cloudflare-ipfs.com',
);
