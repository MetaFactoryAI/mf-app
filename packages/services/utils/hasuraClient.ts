import { GraphQLClient } from 'graphql-request';

import { GRAPHQL_ADMIN_SECRET, GRAPHQL_URL } from 'shared/config/secret';

interface GetClientParams {
  role?: string;
  userId?: string;
  backendOnly?: boolean;
}

export const getClient = (params: GetClientParams = {}): GraphQLClient =>
  new GraphQLClient(GRAPHQL_URL, {
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': GRAPHQL_ADMIN_SECRET,
      'x-hasura-role': params.role || 'admin',
    },
  });

export const client = getClient();
