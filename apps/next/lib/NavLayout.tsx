import React from 'react';
import { NavBar } from 'app/ui/navbar';
import { Box } from 'app/ui/layout';
import { useRouter } from 'next/router';

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

  return (
    <Box>
      <NavBar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        links={[
          {
            href: '/settings',
            label: 'Settings',
            isActive: pathname === '/settings',
          },
          {
            href: '/username/posts',
            label: 'Posts',
            isActive: pathname.endsWith('/posts'),
          },
        ]}
      />
      {children}
    </Box>
  );
};
