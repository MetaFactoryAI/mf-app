import { Text, Pressable } from 'react-native';
import { styled } from 'nativewind';
import { RETRO_FRAME_CLASSES } from 'app/ui/theme/constants';
import React from 'react';

// Add variant to styled() components
const RetroButtonContainer = styled(
  Pressable,
  `px-4 min-h-[40px] items-center justify-center flex-row ${RETRO_FRAME_CLASSES}`,
  {
    variants: {
      disabled: {
        true: 'opacity-50',
      },
      intent: {
        primary: 'bg-brand-9',
        secondary: 'bg-gray-8 ',
      },
      size: {
        small: '',
        icon: '',
        medium: '',
      },
    },
    defaultProps: {
      intent: 'secondary',
      size: 'medium',
    },
  },
);

const RetroButtonText = styled(Text, 'font-mono text-blackA12', {
  variants: {
    size: {
      small: 'text-sm',
      icon: 'text-sm',
      medium: 'text-base',
    },
  },
  defaultProps: {
    size: 'medium',
  },
});

type RetroButtonProps = React.ComponentProps<typeof RetroButtonContainer> & {
  title?: string;
};
export const RetroButton: React.FC<RetroButtonProps> = ({
  size,
  title,
  children,
  intent,
  ...props
}) => (
  <RetroButtonContainer size={size} intent={intent} {...props}>
    <>
      {children}
      {title ? <RetroButtonText size={size}>{title}</RetroButtonText> : null}
    </>
  </RetroButtonContainer>
);
