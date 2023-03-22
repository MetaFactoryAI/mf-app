import { useQuery } from '@tanstack/react-query';
import { utils, BigNumberish } from 'ethers';
import { useContractReads } from 'wagmi';
import _ from 'lodash';
import { NftItem } from './utils/tempType';
import nftWearablesAbi from './utils/nftWearables.json';
import { parseIds } from './utils/nft';

const useNfts = () => {
  const fetchNfts = async () => {
    return fetch('api/nfts')
      .then((res) => res.json())
      .then((data) => {
        const initialObject: { [key: number]: NftItem } = {};
        const nftListObject = _.reduce(
          data,
          (result: Record<string, NftItem>, nft: NftItem) =>
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
  const { data: rawWearables, error } = useContractReads({
    contracts: [
      {
        // TODO replace address
        address: '0x8e9a29e7e8e3dcd7ea31b1792a8078b5723ed4d8',
        abi: nftWearablesAbi,
        functionName: 'balanceOfBatch',
        args: [Array(nftIds.length).fill(address), nftIds],
      },
    ],
    enabled: !!nfts && !!nftIds,
  });

  if (!nftIds || !rawWearables) return { wearables: [], parsedBalances: [] };

  const parsedBalances = _.map(rawWearables, (balance: BigNumberish) =>
    utils.formatUnits(balance, 0),
  );

  // reduce to nft items only with existing balance
  const wearables = parsedBalances.reduce(
    (sum: NftItem[], currentValue: boolean | string, currentIndex: number) => {
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
