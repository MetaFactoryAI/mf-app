/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as systemZeus from './system/zeus';
import * as userZeus from './user/zeus';

export const createClient = (endpoint: string, token: string) => {
  const thunder = userZeus.Thunder((...params) =>
    userZeus.apiFetch([
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

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createSystemClient = (endpoint: string, token: string) => {
  const thunder = systemZeus.Thunder((...params) =>
    systemZeus.apiFetch([
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

export type Client = ReturnType<typeof createClient>;
export type SystemClient = ReturnType<typeof createSystemClient>;

export * from '../constants';
export * as SystemZeus from './system/zeus';
export * from './user/zeus';
