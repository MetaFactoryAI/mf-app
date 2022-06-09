// eslint-disable-next-line
require('dotenv').config();

interface IConfig {
  graphqlUrl: string;
  graphqlToken: string;
}

function parseEnv<T extends string | number>(
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
  graphqlUrl: parseEnv(process.env.GRAPHQL_URL),
  graphqlToken: parseEnv(process.env.GRAPHQL_TOKEN),
};
