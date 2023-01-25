import { Text, View } from 'react-native';
import { styled } from 'nativewind';
import { RETRO_FRAME_CLASSES } from 'app/ui/theme/constants';

// Add variant to styled() components
const RetroButtonContainer = styled(
  View,
  `bg-gray-8 px-4 min-h-[40px] items-center justify-center flex-row ${RETRO_FRAME_CLASSES}`,
  {
    variants: {
      intent: {
        primary: 'bg-brand-9',
      },
      size: {
        small: '',
        icon: '',
        medium: '',
      },
    },
    defaultProps: {
      // intent: 'primary',
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
  ...props
}) => (
  <RetroButtonContainer size={size} {...props}>
    <>
      {children}
      {title ? <RetroButtonText size={size}>{title}</RetroButtonText> : null}
    </>
  </RetroButtonContainer>
);
