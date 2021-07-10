import { ScreenContainer, StyledText } from '@mf/ui';
import React from 'react';

import { MainStackScreenProps, Screen } from '../navigation/types';

type Props = MainStackScreenProps<Screen.PROPOSAL>;

export const ProposalScreen: React.FC<Props> = () => (
  <ScreenContainer p="m">
    <StyledText variant="headerSmall">Proposal Details</StyledText>
  </ScreenContainer>
);

// eslint-disable-next-line import/no-default-export
export default ProposalScreen;
