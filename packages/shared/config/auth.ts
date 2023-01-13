import { getEnvValue } from './getEnvValue';

export const NEXTAUTH_URL = getEnvValue(
  process.env.NEXTAUTH_URL,
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'missing-nextauth-url',
);
export const NEXTAUTH_SECRET = getEnvValue(process.env.NEXTAUTH_SECRET, '');
export const APP_NAME = getEnvValue(process.env.APP_NAME, 'mf-dashboard');
export const SESSION_SECRET = getEnvValue(process.env.SESSION_SECRET, '');
