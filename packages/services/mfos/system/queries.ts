import { ethAddressToEip155 } from '../../utils/addressHelpers';

import { mfosSystemClient } from './client';
import { SystemUser, systemUsersSelector } from './selectors';

export const getSystemUserByAddress = async (
  ethAddress: string,
): Promise<SystemUser | undefined> => {
  const userQuery = await mfosSystemClient('query')({
    users: [
      {
        filter: {
          external_identifier: { _eq: ethAddressToEip155(ethAddress) },
        },
      },
      systemUsersSelector,
    ],
  });

  return userQuery.users?.[0];
};
