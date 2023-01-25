import { configureSIWE } from 'connectkit-next-siwe';
import { SESSION_SECRET } from '../config/auth';

type SessionData = {
  userId?: string;
  isBackend?: boolean;
};

export const siwe = configureSIWE<SessionData>({
  session: { password: SESSION_SECRET },
  apiRoutePrefix: '/api/siwe',
});

export type SiweSession = Awaited<ReturnType<typeof siwe.getSession>>;
