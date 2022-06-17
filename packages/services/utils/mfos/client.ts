import { createClient } from '../../mfos';
import { CONFIG } from '../config';

export const mfosClient = createClient(
  CONFIG.mfosGraphqlUrl,
  CONFIG.mfosGraphqlToken,
);
