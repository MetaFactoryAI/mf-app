/* eslint-disable @typescript-eslint/no-explicit-any */
import _ from 'lodash';
import { useQuery } from '@tanstack/react-query';
import { hasuraClient } from 'services/graphql/client';
import { NftClaim } from './utils/tempType';

// ? handle auth on hasura client?
const useWearableClaims = () => {
  const { data, isLoading, error } = useQuery(
    ['wearableClaims'],
    async () => {
      const data = await hasuraClient.query({
        robot_merkle_claims: [
          { where: { merkle_root: { network: { _eq: 'mainnet' } } } },
          {
            claim_json: [{ path: 'erc1155' }, true], // ! guessed on this
            merkle_root_hash: true,
          },
        ],
      });

      const nftClaimArray: any[] = _.get(data, 'robot_merkle_claims', []);
      const currentNftClaims = nftClaimArray.map((nftClaim: NftClaim) => {
        const claim_count = _.size(
          _.get(nftClaim, 'claim_json.erc1155[0].ids'),
        );

        return {
          ...nftClaim,
          claim_json: {
            ...nftClaim.claim_json,
            claim_count,
          },
        };
      });

      return currentNftClaims;
    },
    { enabled: false },
  );
  return { data, isLoading, error };
};

export default useWearableClaims;
