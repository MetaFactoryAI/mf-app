import React from 'react';

import { styled } from 'nativewind';
import { View } from 'react-native';

// Add variant to styled() components
const ProgressBarContainer = styled(View, `flex-row w-full`, {
  variants: {
    type: {
      simple: 'border border-borderDarkest h-3',
      retro: 'border-t border-l border-borderDark shadow-retroProgress h-4',
    },
  },
  defaultProps: {
    type: 'simple',
  },
});

const ProgressBarFill = styled(View, '', {
  variants: {
    type: {
      simple: 'bg-borderDarkest',
      retro: 'bg-brand-9 mt-px ml-px',
    },
  },
  defaultProps: {
    type: 'simple',
  },
});

type ProgressBarProps = React.ComponentProps<typeof ProgressBarContainer> & {
  progress: number;
  total?: number;
};
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  total = 1,
  type,
  ...props
}) => (
  <ProgressBarContainer type={type} {...props}>
    <ProgressBarFill
      type={type}
      style={{ width: `${((progress / total) * 100).toFixed(0)}%` }}
    />
  </ProgressBarContainer>
);
