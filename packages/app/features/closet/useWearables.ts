import { useQuery } from '@tanstack/react-query';
import { utils, BigNumberish } from 'ethers';
import { useContractRead } from 'wagmi';
import _ from 'lodash';
import {
  NftWearablesAddress,
  NftWearablesAbi,
} from 'contracts/abis/NftWearables';
import { parseIds } from './utils/nft';

const useNfts = () => {
  const fetchNfts = async () => {
    return fetch('api/nftMetadata')
      .then((res) => res.json())
      .then((data) => {
        const initialObject: { [key: number]: any } = {};
        const nftListObject = _.reduce(
          data,
          (result: Record<string, any>, nft: any) =>
            (result[nft.nft_token_id] = nft),
          initialObject,
        );

        return { nfts: nftListObject, nftIds: parseIds(nftListObject) };
      })
      .catch((err) => {
        console.log(err);
        return { nfts: {}, nftIds: [] };
      });
  };

  const { data, isLoading, error } = useQuery<
    { nfts: any; nftIds: any },
    Error
  >(['nfts'], fetchNfts);

  const nfts = _.get(data, 'nfts', null);
  const nftIds = _.get(data, 'nftIds', null);

  return { nfts, nftIds, isLoading, error };
};

// useWearablesForAddress ?
/**
 * Fetches the claimed wearables for a given address
 * @param address address of the user
 * @returns list of wearables `parsedBalances` or error
 */
const useWearables = ({ address }: { address: string }) => {
  const { nfts, nftIds } = useNfts();
  const { data: rawWearables, error } = useContractRead({
    address: NftWearablesAddress.mainnet,
    abi: NftWearablesAbi,
    functionName: 'balanceOfBatch',
    args: [Array(nftIds.length).fill(address), nftIds],
    enabled: !!nfts && !!nftIds,
  });

  if (!nftIds || !rawWearables) return { wearables: [], parsedBalances: [] };

  const parsedBalances = _.map(rawWearables, (balance: BigNumberish) =>
    utils.formatUnits(balance, 0),
  );

  // reduce to nft items only with existing balance
  const wearables = parsedBalances.reduce(
    (sum: any[], currentValue: boolean | string, currentIndex: number) => {
      if (currentValue === '0') return sum;

      const nftId = nftIds[currentIndex];
      const currentItem = nfts[nftId];
      sum.push(currentItem);

      return sum;
    },
    [],
  );

  return { wearables, rawWearables, error };
};

export default useWearables;
