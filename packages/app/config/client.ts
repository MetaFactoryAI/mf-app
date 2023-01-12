export function getEnvValue<T extends string | number>(
  v: string | undefined,
  defaultVal: T,
): T {
  if (v) {
    return typeof defaultVal === 'number' ? (Number(v) as T) : (v as T);
  }
  console.warn(`Using default ENV variable: ${defaultVal}`);
  return defaultVal;
}

export const ALCHEMY_ID = getEnvValue(
  process.env.NEXT_PUBLIC_ALCHEMY_ID,
  'missing-alchemy-id',
);

export const MFOS_GRAPHQL_URL = getEnvValue(
  process.env.NEXT_PUBLIC_MFOS_GRAPHQL_URL,
  'http://localhost:8055/graphql',
);

export const MFOS_GRAPHQL_TOKEN = getEnvValue(
  process.env.NEXT_PUBLIC_MFOS_GRAPHQL_TOKEN,
  '',
);
