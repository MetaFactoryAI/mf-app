import * as React from 'react';
import { Box } from 'app/ui/layout/Box';

const MenuIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const genericHamburgerLine = `h-0.5 w-6 bg-gray-9 transition ease transform duration-300`;

  return (
    <Box className="group flex h-6 w-6 flex-col items-center justify-center">
      <div
        className={`${genericHamburgerLine} ${
          isOpen
            ? 'group-hover:bg-gray-11 translate-y-0.5 rotate-45'
            : 'group-hover:bg-gray-11 translate-y-1.5'
        }`}
      />
      <div
        className={`${genericHamburgerLine} ${
          isOpen
            ? 'group-hover:bg-gray-11 translate-y-0 -rotate-45'
            : 'group-hover:bg-gray-11 -translate-y-1.5'
        }`}
      />
    </Box>
  );
};
export default MenuIcon;
