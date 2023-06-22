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

export async function getWearablesFolder(): Promise<
  { id: string; name: string } | undefined
> {
  const res = await mfosSystemClient('query')({
    folders: [
      {
        filter: {
          name: { _eq: 'Wearables' },
        },
      },
      {
        id: true,
        name: true,
      },
    ],
  });

  return res.folders?.[0];
}
