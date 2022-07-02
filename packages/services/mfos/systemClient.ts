import { CONFIG } from '../utils/config';
import { createSystemClient } from './index';

export const mfosSystemClient = createSystemClient(
  CONFIG.mfosSystemGraphqlUrl,
  CONFIG.mfosGraphqlToken,
);
