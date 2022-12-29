import React from 'react';
import { Link, Text, TextLink } from 'app/ui/typography';
import MenuIcon from 'app/ui/icons/menu';
import { Button } from 'app/ui/Button';
import { ConnectWalletButton } from 'app/lib/ConnectWalletButton';
import { NavBarCollapse } from './NavBarCollapse';
import { Box, Row } from 'app/ui/layout';

type NavBarProps = {
  links: Array<{ href: string; label: string; isActive?: boolean }>;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

// Web Only
export const NavBar: React.FC<NavBarProps> = ({ links, isOpen, setIsOpen }) => {
  return (
    <Box className="sticky top-0 right-0 left-0 z-20 flex w-full">
      <Row className="bg-blackA-12 h-nav-height flex w-full items-center justify-between border-b px-4 backdrop-blur-md backdrop-saturate-150 md:px-6">
        <Link className="flex-1 md:flex-none" href="/">
          <Row className="items-center justify-start">
            <Box className="bg-brand-5 mr-2 h-8 w-8 rounded-full"></Box>
            <Text className="text-gray-9 text-xl font-semibold tracking-tight">
              My App
            </Text>
          </Row>
        </Link>
        <Row className="ml-10 hidden flex-grow md:flex">
          {links.map(({ href, label, isActive }) => (
            <TextLink
              key={href}
              href={href}
              intent={isActive ? 'active' : 'secondary'}
              className={`mr-4`}
            >
              {label}
            </TextLink>
          ))}
        </Row>
        <Row className={'hidden md:flex'}>
          <ConnectWalletButton />
        </Row>
        <Box className="ml-2 md:hidden">
          <Button
            intent={'icon'}
            size={'icon'}
            className={'ml-0'}
            onPress={() => {
              setIsOpen(!isOpen);
            }}
          >
            <MenuIcon isOpen={isOpen} />
          </Button>
        </Box>
      </Row>
      <NavBarCollapse isOpen={isOpen}>
        {links.map(({ href, label, isActive }) => (
          <TextLink
            key={href}
            href={href}
            intent={isActive ? 'active' : 'secondary'}
            className={`mt-6 text-3xl`}
          >
            {label}
          </TextLink>
        ))}
        <Box className={'align-stretch flex h-full py-8'}>
          <ConnectWalletButton />
        </Box>
      </NavBarCollapse>
    </Box>
  );
};
