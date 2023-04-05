import { configureServerSideSIWE } from 'connectkit-next-siwe';
import { SESSION_SECRET } from '../config/auth';

export const siweServer = configureServerSideSIWE({
  session: {
    cookieName: 'mf-next-siwe',
    password: SESSION_SECRET,
  },
});

export type SiweSession = Awaited<ReturnType<typeof siweServer.getSession>>;
