import assert from 'assert';

import { Creator } from 'shared/types/wearableTypes';

import { System } from 'services/mfos';

import {
  ethAddressToEip155,
  resolveIfEnsName,
} from '../../utils/addressHelpers';
import { defaultMainnetProvider } from '../../utils/defaultProvider';
import { logger } from '../../utils/logger';
import { $ } from '../__generated__/user/zeus';

import { mfosSystemClient } from './client';
import { getSystemUserByAddress } from './queries';
import {
  systemRolesSelector,
  SystemUser,
  systemUsersSelector,
} from './selectors';

export const createSystemUserIfNotExists = async (
  creator: Creator,
  roleName?: string,
): Promise<SystemUser> => {
  const ethAddress = await resolveIfEnsName(
    creator.ethAddress,
    defaultMainnetProvider,
  );
  assert(ethAddress, 'ethAddress required');

  const roleQuery = await mfosSystemClient('query')({
    roles: [{ filter: { name: { _eq: roleName } } }, systemRolesSelector],
  });

  const role = roleQuery.roles?.[0];

  const existingUser = await getSystemUserByAddress(ethAddress);

  const user: System.ValueTypes['create_directus_users_input'] = {
    first_name: creator.name,
    external_identifier: ethAddressToEip155(ethAddress),
    provider: 'ethereum',
    status: 'active',
    role,
  };

  if (existingUser?.id) {
    return existingUser;
  }

  logger.info('Create System User', { user });

  const createUserRes = await mfosSystemClient('mutation')(
    {
      create_users_item: [
        {
          data: $('user', 'create_directus_users_input!'),
        },
        systemUsersSelector,
      ],
    },
    {
      operationName: 'createSystemUser',
      variables: {
        user,
      },
    },
  );

  if (!createUserRes.create_users_item) {
    throw new Error('Failed to create system User');
  }

  return createUserRes.create_users_item;
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function uploadFile(
  file: { name: string; url: string },
  tags?: string[],
) {
  const uploadDate = new Date().toISOString();

  const data: System.ValueTypes['create_directus_files_input'] = {
    filename_download: file.name,
    storage: 'ipfs',
    uploaded_on: uploadDate,
    modified_on: uploadDate,
    tags,
  };

  const uploaded = await mfosSystemClient('mutation')(
    {
      import_file: [
        {
          url: file.url,
          data: $('data', 'create_directus_files_input!'),
        },
        {
          id: true,
          filename_download: true,
          storage: true,
          uploaded_on: true,
          modified_on: true,
        },
      ],
    },
    {
      operationName: 'UploadFile',
      variables: {
        data,
      },
    },
  );
  assert(uploaded.import_file);
  return uploaded.import_file;
}
