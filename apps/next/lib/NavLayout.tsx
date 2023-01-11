import React from 'react';
import { NavBar } from 'app/ui/navbar';
import { Box } from 'app/ui/layout';
import { useRouter } from 'next/router';
import { BottomTabs } from 'app/ui/navbar/BottomTabs';

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
      href: '/settings',
      label: 'Settings',
      isActive: pathname === '/settings',
    },
    {
      href: '/metadreamer/posts',
      label: 'Posts',
      isActive: pathname.endsWith('/posts'),
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
