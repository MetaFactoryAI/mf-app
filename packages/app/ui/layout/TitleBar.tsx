import { styled } from 'nativewind';
import { View } from 'react-native';
import React from 'react';
import { Text } from 'app/ui/typography';

export const TitleBarBackground = styled(
  View,
  `bg-gray-12 h-8 mx-0.5 mt-0.5 mb-1 py-1 px-2 flex-row items-center justify-between`,
  {
    variants: {},
    defaultProps: {},
  },
);

type TitleBarProps = React.ComponentProps<typeof TitleBarBackground> & {
  title: string;
};

export const TitleBar: React.FC<TitleBarProps> = ({ children, title }) => {
  return (
    <TitleBarBackground>
      <Text className={'text-gray-1 font-semibold'}>{title}</Text>
      {children}
    </TitleBarBackground>
  );
};
