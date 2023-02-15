/* eslint-disable camelcase */
import { ethers, BigNumber } from 'ethers';
import { getIpfsHash } from './ipfsClient';
import { loadTree } from './merkle';

export interface ClaimWeek {
  [address: string]: number;
}

export const getClaimWeeks = async () => {
  const snapshot = await getIpfsSnapshot();
  const claimWeeks: Record<number, ClaimWeek> = {};

  await Promise.all(
    Object.keys(snapshot).map(async (week: string) => {
      const weekNumber = parseInt(week, 10);

      claimWeeks[weekNumber] = await getIpfsHash(snapshot[week]);
    }),
  );

  return claimWeeks;
};

export const getIpfsSnapshot = async () => {
  const url = `https://${process.env.NEXT_PUBLIC_IPFS_CLAIMS_SNAPSHOT_URL}`;

  return fetch(url).then((res) => res.json());
};

export const getUnclaimedWeeksValues = (
  claimWeeks: Record<number, ClaimWeek>,
  unclaimedWeeks: string[],
  address: string,
) =>
  Object.fromEntries(
    Object.entries(claimWeeks)
      .map((report) => [report[0], report[1][address] || 0])
      .filter(
        (report) =>
          unclaimedWeeks.includes(report[0].toString()) && report[1] > 0,
      ),
  );

export const getClaimedWeeksValues = (
  claimWeeks: Record<number, ClaimWeek>,
  unclaimedWeeks: string[],
  address: string,
) =>
  Object.fromEntries(
    Object.entries(claimWeeks)
      .map((report) => [report[0], report[1][address] || 0])
      .filter(
        (report) =>
          !unclaimedWeeks.includes(report[0].toString()) && report[1] > 0,
      ),
  );

export const getWeekValuesTotal = (unclaimedWeeksValues: {
  [key: number | string]: string;
}) => {
  const weeks = Object.keys(unclaimedWeeksValues);

  return weeks.reduce(
    (sum: number, week: number | string) =>
      sum + parseFloat(unclaimedWeeksValues[week]),
    0,
  );
};

export const getClaimsWeeksProofs = (
  claimWeeks: Record<number, ClaimWeek>,
  unclaimedWeeksValues: { [key: number]: string },
  address: string,
) => {
  const weeks = Object.keys(unclaimedWeeksValues);

  return weeks.map((week) => {
    const weekNumber = parseInt(week, 10);
    const claimBalance = claimWeeks[weekNumber][address];
    const merkleTree = loadTree(claimWeeks[weekNumber]);
    const merkleProof = merkleTree.getHexProof(
      ethers.utils.solidityKeccak256(
        ['address', 'uint256'],
        [address, ethers.utils.parseEther(claimBalance.toString())],
      ),
    ) as `0x${string}`[];
    return {
      week: BigNumber.from(week || 0),
      balance: ethers.utils.parseEther(claimBalance.toString()),
      merkleProof,
    };
  });
};
