import { CONFIG } from '../../utils/config';
import { createSystemClient } from '../__generated__/client';

export const mfosSystemClient = createSystemClient(
  CONFIG.mfosSystemGraphqlUrl,
  CONFIG.mfosGraphqlToken,
);
