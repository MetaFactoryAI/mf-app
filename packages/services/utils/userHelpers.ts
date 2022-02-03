import bcrypt from 'bcrypt';
import { gql } from 'graphql-request';

import { client } from './hasuraClient';

const GET_API_USER_QUERY = gql`
  query GetApiUser($username: String!) {
    user: shop_api_users_by_pk(username: $username) {
      password_hash
    }
  }
`;

type GetApiUserResponse = {
  user?: {
    password_hash: string;
  };
};

export type APITokenResult = { isValid: boolean; username?: string };

export const isValidAuthToken = async (
  token: string | undefined,
): Promise<APITokenResult> => {
  const authTokenReceived = (token || '').split(' ')[1] || '';

  const [username, password] = Buffer.from(authTokenReceived, 'base64')
    .toString()
    .split(':');

  const data = await client.request<GetApiUserResponse>(GET_API_USER_QUERY, {
    username,
  });
  const savedHash = data && data.user && data.user.password_hash;

  if (!savedHash) return { isValid: false };

  const isValid = await bcrypt.compare(password, savedHash);

  return {
    isValid,
    username,
  };
};
