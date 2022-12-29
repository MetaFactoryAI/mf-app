import { Pressable, Text } from 'react-native';
import { styled } from 'nativewind';

// Add variant to styled() components
const RetroButtonContainer = styled(
  Pressable,
  'items-center p-retro active:p-retroActive active:border-none rounded-none bg-gray-8 shadow-retro outline-blackA-12 outline-1 active:outline-dotted focus:outline-dotted outline-offset-[-5px] focus:shadow-retroFocus active:shadow-retroActive',
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
