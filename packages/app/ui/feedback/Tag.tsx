import React from 'react';

import { Box } from '../layout/Box';
import { Text } from 'app/ui/typography';

export type Props = React.ComponentProps<typeof Box> & {
  label: string;
};

export const Tag: React.FC<Props> = ({ label, className, ...props }) => (
  <Text
    className={`py-0.5 px-1.5 text-xs font-semibold ${className}`}
    {...props}
  >
    {label}
  </Text>
);
