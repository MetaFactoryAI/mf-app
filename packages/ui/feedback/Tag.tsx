import React from 'react';

import { Box } from '../layout/Box';
import { StyledText } from '../typography/StyledText';

export type Props = React.ComponentProps<typeof Box> & {
  label: string;
};

export const Tag: React.FC<Props> = ({ label, ...props }) => (
  <Box bg="buttonDisabled" py="2xs" px="s" {...props}>
    <StyledText variant="tag">{label}</StyledText>
  </Box>
);
