import { configureSIWE } from 'connectkit-next-siwe';
import { SESSION_SECRET } from 'app/config/server';

export const siwe = configureSIWE({
  session: { password: SESSION_SECRET },
  apiRoutePrefix: '/api/siwe',
});
