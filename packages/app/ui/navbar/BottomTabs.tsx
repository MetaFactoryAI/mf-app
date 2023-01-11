import React from 'react';
import { TextLink } from 'app/ui/typography';
import { Box, Row } from 'app/ui/layout';

type BottomTabsProps = {
  links: Array<{ href: string; label: string; isActive?: boolean }>;
};

// Web Only
export const BottomTabs: React.FC<BottomTabsProps> = ({ links }) => {
  return (
    <Box className="sticky bottom-0 right-0 left-0 z-20 flex w-full border-y bg-black pb-[env(safe-area-inset-bottom)] md:hidden">
      <Row className="h-bottom-tabs-height flex w-full flex-row items-center justify-around ">
        {links.map(({ href, label, isActive }) => (
          <TextLink
            key={href}
            href={href}
            intent={isActive ? 'active' : 'secondary'}
          >
            {label}
          </TextLink>
        ))}
      </Row>
    </Box>
  );
};
