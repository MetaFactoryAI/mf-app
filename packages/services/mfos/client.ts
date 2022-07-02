import { CONFIG } from '../utils/config';
import { createClient } from './index';

export const mfosClient = createClient(
  CONFIG.mfosGraphqlUrl,
  CONFIG.mfosGraphqlToken,
);
