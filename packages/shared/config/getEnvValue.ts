export function getEnvValue<T extends string | number>(
  v: string | undefined,
  defaultVal?: T,
): T {
  if (v) {
    return typeof defaultVal === 'number' ? (Number(v) as T) : (v as T);
  }

  if (defaultVal === undefined) throw new Error('Missing ENV Variable');

  console.warn(`Using default ENV variable: ${defaultVal}`);
  return defaultVal;
}
