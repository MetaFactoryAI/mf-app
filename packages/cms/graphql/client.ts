import { apiFetch, Thunder } from './zeus';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createClient = (endpoint: string, token: string) => {
  const thunder = Thunder((...params) =>
    apiFetch([
      endpoint,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    ])(...params),
  );

  return {
    query: thunder('query'),
    mutate: thunder('mutation'),
  };
};

export * from './zeus';
