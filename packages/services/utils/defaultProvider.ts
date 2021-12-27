import { getDefaultProvider } from '@ethersproject/providers';

import { CONFIG } from './config';

export const defaultMainnetProvider = getDefaultProvider('mainnet', {
  alchemy: CONFIG.alchemyId,
  infura: CONFIG.infuraId,
  quorum: 1,
});
