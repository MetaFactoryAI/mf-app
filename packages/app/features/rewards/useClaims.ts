import { useMemo } from 'react';
import {
  getClaimWeeks,
  getUnclaimedWeeksValues,
  getClaimedWeeksValues,
  getWeekValuesTotal,
  getClaimsWeeksProofs,
} from './utils/claims';
import { useQuery } from '@tanstack/react-query';
import { formatNumber } from './utils/format';
import {
  useAccount,
  useContractRead,
  usePrepareContractWrite,
  useContractWrite,
} from 'wagmi';
import { BigNumber } from 'ethers';
import { MerkleRedeemABI } from 'contracts/abis/MerkleRedeem';

const useClaims = () => {
  const { address } = useAccount();

  const { data: claimWeeksData } = useQuery(['claimWeeks'], async () => {
    const claimWeeks = await getClaimWeeks();

    const latestWeek =
      claimWeeks &&
      Math.max(
        ...Object.keys(claimWeeks).map((numStr) => parseInt(numStr, 10)),
      );

    return { claimWeeks, latestWeek };
  });

  const { data: unclaimedWeeks } = useContractRead({
    abi: MerkleRedeemABI,
    address: process.env.NEXT_PUBLIC_MERKLE_REDEEM_CONTRACT,
    functionName: 'claimStatus',
    args: [
      address || '0x',
      BigNumber.from(1),
      BigNumber.from(claimWeeksData?.latestWeek || 0),
    ],

    enabled: Boolean(address && claimWeeksData?.latestWeek),
    select: (claimStatus) => {
      const unclaimedWeeks = claimStatus
        .map((value: boolean, index): [string, boolean] => [
          (index + 1).toString(),
          value,
        ])
        .filter((status) => !status[1])
        .map((status): string => status[0]);

      return unclaimedWeeks;
    },
  });

  const {
    claimWeeksProofs,
    claimedTotal,
    unclaimedTotal,
    claimedWeeksValues,
    unclaimedWeeksValues,
  } = useMemo(() => {
    const unclaimedWeeksValues = getUnclaimedWeeksValues(
      claimWeeksData?.claimWeeks || {},
      unclaimedWeeks || [],
      address || '0x',
    );
    const unclaimedTotal = formatNumber(
      getWeekValuesTotal(unclaimedWeeksValues),
    );

    const claimedWeeksValues = getClaimedWeeksValues(
      claimWeeksData?.claimWeeks || {},
      unclaimedWeeks || [],
      address || '0x',
    );
    const claimedTotal = formatNumber(getWeekValuesTotal(claimedWeeksValues));

    const claimWeeksProofs = getClaimsWeeksProofs(
      claimWeeksData?.claimWeeks || {},
      unclaimedWeeksValues,
      address || '0x',
    );

    return {
      claimWeeksProofs,
      claimedTotal,
      unclaimedTotal,
      claimedWeeksValues,
      unclaimedWeeksValues,
    };
  }, [claimWeeksData, unclaimedWeeks, address]);

  const { config } = usePrepareContractWrite({
    abi: MerkleRedeemABI,
    address: process.env.NEXT_PUBLIC_MERKLE_REDEEM_CONTRACT,
    functionName: 'claimWeeks',
    args: [address || '0x', claimWeeksProofs],
  });
  const claimRewardWrite = useContractWrite(config);

  return {
    unclaimedTotal,
    claimedTotal,
    claimedWeeksValues,
    unclaimedWeeksValues,
    claimRewardWrite,
  };
};

export default useClaims;
