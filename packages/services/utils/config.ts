// eslint-disable-next-line
require('dotenv').config();

interface IConfig {
  appName: string;
  graphqlURL: string;
  graphqlAdminSecret: string;
  mfosUrl: string;
  mfosGraphqlUrl: string;
  mfosSystemGraphqlUrl: string;
  mfosGraphqlToken: string;
  locksmithAccessToken: string;
  locksmithEndpoint: string;
  shopDomain: string;
  infuraId: string;
  alchemyId: string;
}

export function parseEnv<T extends string | number>(
  v: string | undefined,
  defaultValue?: T,
): T {
  if (v) {
    return typeof defaultValue === 'number' ? (Number(v) as T) : (v as T);
  }

  if (!defaultValue) throw new Error('Missing ENV Variable');

  return defaultValue;
}

export const CONFIG: IConfig = {
  appName: 'mf-dashboard',
  graphqlURL: parseEnv(process.env.GRAPHQL_URL),
  graphqlAdminSecret: parseEnv(process.env.GRAPHQL_ADMIN_SECRET),
  mfosUrl: parseEnv(process.env.MFOS_URL),
  mfosGraphqlUrl: parseEnv(process.env.MFOS_GRAPHQL_URL),
  mfosSystemGraphqlUrl: parseEnv(process.env.MFOS_SYSTEM_GRAPHQL_URL),
  mfosGraphqlToken: parseEnv(process.env.MFOS_GRAPHQL_TOKEN),
  locksmithAccessToken: parseEnv(process.env.LS_ACCESS_TOKEN),
  locksmithEndpoint: parseEnv(process.env.LS_ENDPOINT),
  shopDomain: parseEnv(process.env.SHOP_DOMAIN, 'metafactory.myshopify.com'),
  infuraId: parseEnv(process.env.INFURA_ID),
  alchemyId: parseEnv(process.env.ALCHEMY_ID, ''),
};
