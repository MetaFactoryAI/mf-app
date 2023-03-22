import _ from 'lodash';
import {
  useContractReads,
  usePrepareContractWrite,
  useContractWrite,
} from 'wagmi';
import useWearableClaims from './useWearableClaims';
import nftGiveawayAbi from './utils/nftGiveaway.json';
import { NftClaim } from './utils/tempType';

const useWearableClaim = ({ id, address }: { id: string; address: string }) => {
  const { data: wearableClaims } = useWearableClaims();
  const rootHashes = _.map(
    wearableClaims,
    (nftClaim: NftClaim) => nftClaim.merkle_root_hash,
  );
  const { data: claimedStatuses } = useContractReads({
    contracts: [
      {
        abi: nftGiveawayAbi,
        address,
        functionName: 'getClaimedStatus',
        args: [address, rootHashes],
      },
    ],
  });

  // ? is this the right way to get claim count?
  // const claim = _.find(
  //   wearableClaims,
  //   (claim) => claim.merkle_root_hash === id,
  // );
  // const claimJson = _.get(claim, 'claim_json', {});
  // const claimCount = _.size(_.get(claimJson, 'erc1155[0].ids'));

  const unclaimedWearableClaims = _.reduce(
    claimedStatuses as boolean[],
    (sum: NftClaim[], currentValue: boolean, currentIndex: number) => {
      if (currentValue === true) return sum;

      const unclaimedRootHash = rootHashes[currentIndex];
      const unclaimedNftClaim = _.find(
        wearableClaims,
        (claim: NftClaim) => claim.merkle_root_hash === unclaimedRootHash,
      );

      if (unclaimedNftClaim) sum.push(unclaimedNftClaim);

      return sum;
    },
    [],
  );

  const claims = _.map(wearableClaims, (nftClaim: NftClaim) => ({
    to: nftClaim.claim_json.to,
    erc1155: nftClaim.claim_json.erc1155,
    erc721: nftClaim.claim_json.erc721,
    erc20: nftClaim.claim_json.erc20,
    salt: nftClaim.claim_json.salt,
  }));
  const merkleProofs = _.map(wearableClaims, (nftClaim: NftClaim) =>
    _.get(nftClaim, 'claim_json.proof'),
  );

  const { config } = usePrepareContractWrite({
    address: '0x',
    abi: nftGiveawayAbi,
    functionName: 'claimMultipleTokensFromMultipleMerkleTree',
    args: [rootHashes, claims, merkleProofs],
  });

  const { writeAsync } = useContractWrite({
    ...config,
    onSuccess: () => {
      console.log('success');
    },
    onError: (error) => {
      console.log('error', error);
    },
  });

  return {
    writeAsync,
    // claimCount,
    unclaimedWearableClaims,
    allIsClaimed: _.size(unclaimedWearableClaims),
  };
};

export default useWearableClaim;
