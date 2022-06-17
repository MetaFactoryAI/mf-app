import { createClient } from '@mf/cms';

import { CONFIG } from '../config';

export const mfosClient = createClient(
  CONFIG.mfosGraphqlUrl,
  CONFIG.mfosGraphqlToken,
);
