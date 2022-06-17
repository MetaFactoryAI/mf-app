/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as systemZeus from './system/zeus';
import * as userZeus from './user/zeus';

export const createClient = (endpoint: string, token: string) =>
  userZeus.Thunder((...params) =>
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

export const createThunderClient = (endpoint: string, token: string) =>
  userZeus.Thunder((...params) =>
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

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/ban-ts-comment
// @ts-ignore infer problem
export const createSystemClient = (endpoint: string, token: string) =>
  systemZeus.Thunder((...params) =>
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

export type Client = ReturnType<typeof createClient>;
export type SystemClient = ReturnType<typeof createSystemClient>;
