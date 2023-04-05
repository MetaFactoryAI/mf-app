import _ from 'lodash';
import {
  useContractRead,
  usePrepareContractWrite,
  useContractWrite,
  mainnet,
} from 'wagmi';
import { api } from 'app/lib/api';
import { NftGiveawayAddress, NftGiveawayAbi } from 'contracts/abis/NftGiveaway';
import { BigNumber } from 'ethers';

export const useClaimWearables = ({ address }: { address: `0x${string}` }) => {
  const { data: wearableClaims, isLoading: wearableClaimsLoading } =
    api.wearables.merkleClaims.useQuery();

  const rootHashes =
    wearableClaims?.map((nftClaim) => nftClaim.merkle_root_hash) || [];
  const { data: claimedStatuses, isLoading: claimStatusLoading } =
    useContractRead({
      abi: NftGiveawayAbi,
      address: NftGiveawayAddress[mainnet.id],
      functionName: 'getClaimedStatus',
      args: [address, rootHashes],
      enabled: Boolean(address && rootHashes.length),
    });

  const unclaimedWearableClaims = _.reduce(
    claimedStatuses as boolean[],
    (
      unclaimed: NonNullable<typeof wearableClaims>,
      currentValue: boolean,
      currentIndex: number,
    ) => {
      if (currentValue || !wearableClaims) return unclaimed;

      const unclaimedNftClaim = wearableClaims[currentIndex];

      if (unclaimedNftClaim) unclaimed.push(unclaimedNftClaim);

      return unclaimed;
    },
    [],
  );

  const claimsJSON = _.map(wearableClaims, (nftClaim) => ({
    ...nftClaim.claim_json,
    erc1155: nftClaim.claim_json.erc1155.map((nft) => ({
      ...nft,
      // TODO: test if it works without converting to BigNumber
      ids: nft.ids.map(BigNumber.from),
      values: nft.values.map(BigNumber.from),
    })),
  }));
  const merkleProofs = _.map(
    wearableClaims,
    (nftClaim) => nftClaim.claim_json.proof,
  );

  const { config } = usePrepareContractWrite({
    address: NftGiveawayAddress[mainnet.id],
    abi: NftGiveawayAbi,
    functionName: 'claimMultipleTokensFromMultipleMerkleTree',
    args: [rootHashes, claimsJSON, merkleProofs],
  });

  const claimWearablesWrite = useContractWrite(config);

  return {
    claimWearablesWrite,
    unclaimedWearableClaims,
    isLoading: claimStatusLoading || wearableClaimsLoading,
  };
};
