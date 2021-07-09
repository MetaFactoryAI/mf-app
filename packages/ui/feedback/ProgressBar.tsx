import React from 'react';

import { Box } from '../layout/Box';

export type Props = React.ComponentProps<typeof Box> & {
  progress: number;
  total?: number;
};

export const ProgressBar: React.FC<Props> = ({
  progress,
  total = 1,
  ...props
}) => (
  <Box row borderWidth={1} width="100%" height={10} {...props}>
    <Box
      width={`${((progress / total) * 100).toFixed(2)}%`}
      bg="shapeBgContrast"
    />
  </Box>
);
