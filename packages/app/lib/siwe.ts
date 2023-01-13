import { configureSIWE } from 'connectkit-next-siwe';
import { SESSION_SECRET } from 'shared/config/auth';

export const siwe = configureSIWE({
  session: { password: SESSION_SECRET },
  apiRoutePrefix: '/api/siwe',
});
