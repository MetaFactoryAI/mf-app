import React from 'react';

import { Box } from '../layout/Box';

export type Props = React.ComponentProps<typeof Box> & {
  label: string;
};

export const Tag: React.FC<Props> = ({ label, className, ...props }) => (
  <Box
    className={`py-0.5 px-1.5 text-xs font-semibold ${className}`}
    {...props}
  >
    {label}
  </Box>
);
