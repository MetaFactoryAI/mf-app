import { createClient, createStorage } from 'wagmi';
import { provider } from 'shared/config/chains';
import { noopStorage } from '@wagmi/core';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { getDefaultClient } from 'connectkit/build';
// import { ALCHEMY_ID } from 'app/config/env';

const asyncStoragePersistor = createAsyncStoragePersister({
  storage: AsyncStorage,
});

export const wagmiClient = createClient({
  autoConnect: true,
  persister: asyncStoragePersistor,
  storage: createStorage({ storage: noopStorage }),
  provider,
});

// export const wagmiClient = createClient({
//   ...getDefaultClient({
//     appName: 'METADREAM',
//     alchemyId: ALCHEMY_ID,
//     chains: chains,
//     provider: provider,
//   }),
//
//   persister: asyncStoragePersistor,
//   storage: createStorage({ storage: noopStorage }),
// });
