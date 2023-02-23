import { createParam } from 'solito';

import { Box } from 'app/ui/layout/Box';
import { H1, H3, P } from 'app/ui/typography';
import useClaims from './useClaims';
import { TitleBar } from 'app/ui/layout/TitleBar';
import React from 'react';
import { RewardsTable } from 'app/features/rewards/RewardsTable';
import { RetroButton } from 'app/ui/input/RetroButton';

export const { useParam } = createParam<{ username: string }>();

export function RewardsClaimScreen() {
  const {
    unclaimedTotal,
    claimedTotal,
    claimRewardWrite,
    claimedWeeksValues,
    unclaimedWeeksValues,
  } = useClaims();

  return (
    <Box className="container w-full flex-1 items-center self-center p-3">
      <H1 className={'my-10 w-full'}>ROBOT Rewards</H1>
      <Box className="grid w-full grid-cols-1 gap-y-4 lg:grid-cols-3 lg:gap-x-4">
        <Box className="col-span-2 gap-4">
          <Box frame>
            <TitleBar title={'Unclaimed ROBOT'}></TitleBar>
            <Box className={'px-4'}>
              <Box className="w-full">
                <RewardsTable
                  values={unclaimedWeeksValues}
                  emptyText={"There isn't any unclaimed ROBOT here"}
                  totalValue={unclaimedTotal}
                />
              </Box>
            </Box>
          </Box>
          <Box frame>
            <TitleBar title={'Claimed ROBOT'}></TitleBar>
            <Box className={'px-4'}>
              <Box className="w-full">
                <RewardsTable
                  values={claimedWeeksValues}
                  emptyText={"You haven't claimed any ROBOT yet"}
                  totalValue={claimedTotal}
                />
              </Box>
            </Box>
          </Box>
        </Box>
        <Box className="order-first lg:order-last">
          <Box frame>
            <TitleBar title={'Total unclaimed ROBOT'}></TitleBar>
            <Box className={'p-4'}>
              <Box className="w-full">
                <H3 className={'text-center font-mono'}>
                  {unclaimedTotal} ROBOT
                </H3>
              </Box>
              <RetroButton
                intent={'primary'}
                onPress={() => claimRewardWrite?.writeAsync?.()}
                className="mt-4"
                title="Claim"
                disabled={
                  parseFloat(unclaimedTotal) === 0 ||
                  !claimRewardWrite?.writeAsync
                }
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
