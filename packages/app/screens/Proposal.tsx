import { Card, ScreenContainer, StyledText } from '@mf/ui';
import React from 'react';

import { MainStackScreenProps, Screen } from '../navigation/types';

export type Props = MainStackScreenProps<Screen.PROPOSAL>;

export const ProposalScreen: React.FC<Props> = () => (
  <ScreenContainer p="m">
    <Card p="s">
      <StyledText variant="headerSmall">Proposal Details</StyledText>
    </Card>
  </ScreenContainer>
);

// eslint-disable-next-line import/no-default-export
export default ProposalScreen;
