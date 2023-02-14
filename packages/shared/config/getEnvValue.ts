export function getEnvValue<T extends string | number>(
  v: string | undefined,
  defaultVal?: T,
): T {
  if (v && process.env[v]) {
    return typeof defaultVal === 'number'
      ? (Number(v) as T)
      : (process.env[v] as T);
  }

  if (defaultVal === undefined)
    throw new Error(`Missing ENV Variable: ${v} and NO DEFAULT AVAILABLE`);

  console.warn(`Using default ENV variable: ${defaultVal} for value: ${v}`);
  return defaultVal;
}
