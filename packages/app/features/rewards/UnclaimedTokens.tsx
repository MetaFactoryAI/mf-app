import React from 'react';
import { Box } from 'app/ui/layout/Box';
import { H1, H2 } from 'app/ui/typography';
import { RetroButton } from 'app/ui/input/RetroButton';

export const UnclaimedTokens: React.FC<{
  unclaimedTotal: string;
  handleClaim?: () => void;
}> = ({ unclaimedTotal, handleClaim }) => (
  <Box>
    <H1>Total pending ROBOT</H1>

    <Box className="w-full">
      <H2>{unclaimedTotal}</H2>
    </Box>
    <RetroButton onClick={handleClaim} className="my-8" title="Claim" />
  </Box>
);
