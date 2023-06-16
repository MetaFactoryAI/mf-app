import { getDefaultProvider } from '@ethersproject/providers';

import { ALCHEMY_ID, INFURA_ID } from 'shared/config/secret';

export const defaultMainnetProvider = getDefaultProvider('mainnet', {
  alchemy: ALCHEMY_ID,
  infura: INFURA_ID,
  quorum: 1,
});
