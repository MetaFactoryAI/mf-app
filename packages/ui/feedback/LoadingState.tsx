import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import { Box } from '../layout/Box';
import { StyledText } from '../typography/StyledText';
import { Props as SpinnerProps, Spinner } from './Spinner';

type Props = SpinnerProps & {
  description?: string | null;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const LoadingState: React.FC<Props> = ({
  children,
  description,
  style,
  ...props
}) => (
  <Box flex={1} centered p="m" style={style}>
    <Spinner size="large" {...props} />
    {description ? (
      <StyledText mt="s" color="secondaryContent" textAlign="center">
        {description}
      </StyledText>
    ) : null}
    {children}
  </Box>
);
