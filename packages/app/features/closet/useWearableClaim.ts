import _ from 'lodash';
import {
  useContractRead,
  usePrepareContractWrite,
  useContractWrite,
} from 'wagmi';
import { api } from 'app/lib/api';
import { NftGiveawayAddress, NftGiveawayAbi } from 'contracts/abis/NftGiveaway';

export const useWearableClaim = ({ address }: { address: string }) => {
  const { data: wearableClaims, isLoading: wearableClaimsLoading } =
    api.claims.wearableMerkleClaims.useQuery();

  const rootHashes = wearableClaims?.map(
    (nftClaim) => nftClaim.merkle_root_hash,
  );
  const { data: claimedStatuses, isLoading: claimStatusLoading } =
    useContractRead({
      abi: NftGiveawayAbi,
      address: NftGiveawayAddress.mainnet,
      functionName: 'getClaimedStatus',
      args: [address, rootHashes],
      enabled: !!address && !!rootHashes,
    });

  const unclaimedWearableClaims = _.reduce(
    claimedStatuses as boolean[],
    (
      unclaimed: NonNullable<typeof wearableClaims>,
      currentValue: boolean,
      currentIndex: number,
    ) => {
      if (currentValue === true || !wearableClaims) return unclaimed;

      const unclaimedNftClaim = wearableClaims[currentIndex];

      if (unclaimedNftClaim) unclaimed.push(unclaimedNftClaim);

      return unclaimed;
    },
    [],
  );

  const claims = _.map(wearableClaims, (nftClaim) =>
    _.omit(nftClaim.claim_json, ['claim_count']),
  );
  const merkleProofs = _.map(
    wearableClaims,
    (nftClaim) => nftClaim.claim_json.proof,
  );

  const { config } = usePrepareContractWrite({
    address: NftGiveawayAddress.mainnet,
    abi: NftGiveawayAbi,
    functionName: 'claimMultipleTokensFromMultipleMerkleTree',
    args: [rootHashes, claims, merkleProofs],
  });

  const claimWearablesWrite = useContractWrite(config);

  return {
    claimWearablesWrite,
    unclaimedWearableClaims,
    isLoading: claimStatusLoading || wearableClaimsLoading,
  };
};
