import { configureClientSIWE } from 'connectkit-next-siwe';

export const siweClient = configureClientSIWE({
  apiRoutePrefix: '/api/siwe',
});
