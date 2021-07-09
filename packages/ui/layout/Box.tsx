import { useTheme } from '@shopify/restyle';
import React from 'react';

import { Theme } from '../theme';
import { createBox } from '../utils/createBox';

const BaseBox = createBox();

export type BoxProps = React.ComponentProps<typeof BaseBox> & {
  bordered?: boolean;
  centered?: boolean;
  row?: boolean;
  contentContainer?: boolean;
};

// The most basic / abstract component, equivalent to "div" on web
export const Box: React.FC<BoxProps> = ({
  centered,
  bordered,
  contentContainer,
  row,
  ...props
}) => {
  const theme = useTheme<Theme>();

  return (
    <BaseBox
      overflow="hidden"
      borderColor="border"
      {...(row && { flexDirection: 'row' })}
      {...(centered && { alignItems: 'center', justifyContent: 'center' })}
      {...(bordered && {
        borderStyle: 'solid',
        borderWidth: theme.constants.borderWidth,
      })}
      {...(contentContainer && {
        width: '100%',
        maxWidth: theme.constants.maxContentWidth,
      })}
      {...props}
    />
  );
};
