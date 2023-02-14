import { getEnvValue } from './getEnvValue';

export const NEXTAUTH_URL = getEnvValue(
  'NEXTAUTH_URL',
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'missing-nextauth-url',
);
export const NEXTAUTH_SECRET = getEnvValue('NEXTAUTH_SECRET', '');
export const APP_NAME = getEnvValue('APP_NAME', 'mf-dashboard');
export const SESSION_SECRET = getEnvValue('SESSION_SECRET', '');
