import { gql } from 'graphql-request';

import { LocksmithLockResponse } from '../types/locksmith';
import { getRandomElement } from './arrayHelpers';
import { client } from './hasuraClient';

const GET_EXISTING_CODE_QUERY = gql`
  query GetExistingAccessCode($uniqueIdentifier: String!, $lockId: String!) {
    shop_product_locks(
      where: {
        _and: {
          customer_eth_address: { _eq: $uniqueIdentifier }
          lock_id: { _eq: $lockId }
        }
      }
    ) {
      access_code
      customer_eth_address
      lock_id
    }
  }
`;

const GET_NEW_CODE_QUERY = gql`
  query GetNewAccessCode($lockId: String!) {
    shop_product_locks(
      where: {
        _and: {
          customer_eth_address: { _is_null: true }
          lock_id: { _eq: $lockId }
        }
      }
      limit: 20
    ) {
      access_code
      lock_id
    }
  }
`;

const CLAIM_CODE_MUTATION = gql`
  mutation ClaimCode(
    $accessCode: String!
    $lockId: String!
    $uniqueIdentifier: String!
  ) {
    claimedLock: update_shop_product_locks_by_pk(
      pk_columns: { access_code: $accessCode, lock_id: $lockId }
      _set: { customer_eth_address: $uniqueIdentifier }
    ) {
      customer_eth_address
      lock_id
      access_code
    }
  }
`;

type ProductLock = {
  access_code: string;
  customer_eth_address?: string;
  lock_id: string;
};

type GetCodeResponse = {
  shop_product_locks?: Array<ProductLock>;
};

type ClaimCodeResponse = {
  claimedLock?: ProductLock;
};

export const getOrCreateLock = async (
  lockId: string,
  uniqueIdentifier: string,
): Promise<ProductLock | null> => {
  const data = await client.request<GetCodeResponse>(GET_EXISTING_CODE_QUERY, {
    uniqueIdentifier,
    lockId,
  });
  const existingLock =
    data && data.shop_product_locks && data.shop_product_locks[0];

  if (existingLock) return existingLock;

  const newCodeData = await client.request<GetCodeResponse>(
    GET_NEW_CODE_QUERY,
    {
      lockId,
    },
  );

  const newCodes = newCodeData.shop_product_locks || [];

  if (!newCodes.length) return null;

  const newCode = getRandomElement(newCodes);

  const claimedLockData = await client.request<ClaimCodeResponse>(
    CLAIM_CODE_MUTATION,
    {
      lockId: newCode.lock_id,
      accessCode: newCode.access_code,
      uniqueIdentifier,
    },
  );

  return claimedLockData.claimedLock || null;
};

export const isCodeRedeemed = (
  code: string,
  lockResponse: LocksmithLockResponse,
): boolean => {
  const availableCodes =
    lockResponse.keys[0].conditions.find((c) => c.type === 'passcodes')?.options
      .passcodes || [];

  return availableCodes.indexOf(code) === -1;
};
