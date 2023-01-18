import React from 'react';
import { View } from 'react-native';

import { styled } from 'nativewind';
import { Box } from 'app/ui/layout/Box';

const NavBarCollapseContainer = styled(
  View,
  'bg-black absolute top-0 right-0 left-0 w-full backdrop-blur-lg backdrop-saturate-150 overflow-hidden md:hidden',
  {
    variants: {
      isOpen: {
        true: 'top-nav-height pb-nav-height h-screen',
        false: 'h-0',
      },
    },
  },
);

type NavBarProps = React.ComponentProps<typeof NavBarCollapseContainer>;

export const NavBarCollapse: React.FC<NavBarProps> = ({ isOpen, children }) => {
  return (
    <NavBarCollapseContainer isOpen={isOpen}>
      <Box className="h-full max-h-full px-6">{children}</Box>
    </NavBarCollapseContainer>
  );
};
