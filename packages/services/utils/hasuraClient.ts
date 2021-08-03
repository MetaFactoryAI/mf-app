import { GraphQLClient } from 'graphql-request';

import { CONFIG } from './config';

interface GetClientParams {
  role?: string;
  userId?: string;
  backendOnly?: boolean;
}

export const getClient = (params: GetClientParams = {}) =>
  new GraphQLClient(CONFIG.graphqlURL, {
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': CONFIG.graphqlAdminSecret,
      'x-hasura-role': params.role || 'admin',
      'x-hasura-user-id': params.userId || '',
    },
  });

export const client = getClient();
