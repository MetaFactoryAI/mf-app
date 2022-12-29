import * as React from 'react';
import { Box } from 'app/ui/layout';

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
const gray = {
  gray1: '#fcfcfc',
  gray2: '#f8f8f8',
  gray3: '#f3f3f3',
  gray4: '#ededed',
  gray5: '#e8e8e8',
  gray6: '#e2e2e2',
  gray7: '#dbdbdb',
  gray8: '#c7c7c7',
  gray9: '#8f8f8f',
  gray10: '#858585',
  gray11: '#6f6f6f',
  gray12: '#171717',
};
