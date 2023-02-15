import { createParam } from 'solito';

import { Box } from 'app/ui/layout/Box';
import { H2 } from 'app/ui/typography';
import useClaims from './useClaims';
import { UnclaimedTokens } from './UnclaimedTokens';

export const { useParam } = createParam<{ username: string }>();

export function RewardsClaimScreen() {
  const { unclaimedTotal, claimedTotal, claimRewardWrite } = useClaims();
  console.log(unclaimedTotal);

  return (
    <Box className="flex-1 items-center justify-center p-3">
      <H2>Claimed: {claimedTotal}</H2>
      <UnclaimedTokens
        unclaimedTotal={unclaimedTotal}
        handleClaim={claimRewardWrite?.writeAsync}
      />
    </Box>
  );
}
