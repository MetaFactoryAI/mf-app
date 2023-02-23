import React from 'react';
import { NavBar } from 'app/ui/navbar';
import { useRouter } from 'next/router';
import { BottomTabs } from 'app/ui/navbar/BottomTabs';
import { Box } from 'app/ui/layout/Box';

type NavLayoutProps = {
  children: React.ReactNode;
};

export const NavLayout: React.FC<NavLayoutProps> = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { pathname } = useRouter();

  // Close navbar on path change
  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const links = [
    {
      href: '/shop',
      label: 'Shop',
      isActive: pathname === '/shop',
    },
    {
      href: '/rewards',
      label: 'Rewards',
      isActive: pathname.endsWith('/rewards'),
    },
    {
      href: '/inventory',
      label: 'Inventory',
      isActive: pathname === '/inventory',
    },
  ];

  return (
    <Box className={'h-full'}>
      <NavBar isOpen={isOpen} setIsOpen={setIsOpen} links={links} />
      {children}
      <BottomTabs links={links} />
    </Box>
  );
};
