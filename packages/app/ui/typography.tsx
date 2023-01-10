import { ComponentProps, forwardRef } from 'react';
import { Text as NativeText, Platform, Linking } from 'react-native';
import { styled, ClassProp } from 'nativewind';
import { TextLink as SolitoTextLink, Link as SolitoLink } from 'solito/link';

export const Text = styled(NativeText);

/**
 * You can use this pattern to create components with default styles
 */
export const P = styled(NativeText, 'text-base text-grayText my-4');

/**
 * Components can have defaultProps and styles
 */
export const H1 = styled(
  NativeText,
  'text-3xl text-grayText font-extrabold my-4',
);
H1.defaultProps = {
  accessibilityLevel: 1,
  accessibilityRole: 'header',
};

export const H2 = styled(
  NativeText,
  'text-2xl text-grayText font-extrabold my-3',
);
H2.defaultProps = {
  accessibilityLevel: 2,
  accessibilityRole: 'header',
};

export const H3 = styled(NativeText, 'text-xl text-grayText font-bold my-3');
H3.defaultProps = {
  accessibilityLevel: 3,
  accessibilityRole: 'header',
};

/**
 * This is a more advanced component with custom styles and per-platform functionality
 */
export interface AProps extends ComponentProps<typeof Text> {
  href?: string;
  target?: '_blank';
}

export const A = forwardRef<NativeText, ClassProp & AProps>(function A(
  { className = '', href, target, ...props },
  ref,
) {
  const nativeAProps = Platform.select<Partial<AProps>>({
    web: {
      href,
      target,
      hrefAttrs: {
        rel: 'noreferrer',
        target,
      },
    },
    default: {
      onPress: (event) => {
        props.onPress && props.onPress(event);
        if (Platform.OS !== 'web' && href !== undefined) {
          Linking.openURL(href);
        }
      },
    },
  });

  return (
    <Text
      accessibilityRole="link"
      className={`text-blue-11 hover:underline ${className}`}
      {...props}
      {...nativeAProps}
      ref={ref}
    />
  );
});

/**
 * Solito's TextLink doesn't work directly with styled() since it has a textProps prop
 * By wrapping it in a function, we can forward style down properly.
 */
export const TextLink = styled(
  function TextLink({
    style,
    textProps,
    children,
    ...props
  }: React.ComponentProps<typeof SolitoTextLink>) {
    return (
      <SolitoTextLink
        // @ts-expect-error css style number vs string
        textProps={{ ...textProps, style: [style, textProps?.style] }}
        {...props}
      >
        {children}
      </SolitoTextLink>
    );
  },
  'text-base transition font-bold',
  {
    variants: {
      intent: {
        primary: 'text-blue-11 hover:text-blue-9',
        secondary: 'text-grayTextSubtle hover:text-grayText',
        active: 'text-grayText',
      },
    },
    defaultProps: {
      intent: 'primary',
      size: 'medium',
    },
  },
);

export const Link = styled(function Link({
  style,
  viewProps,
  children,
  ...props
}: React.ComponentProps<typeof SolitoLink>) {
  return (
    <SolitoLink
      // @ts-expect-error css style string literal type issue
      viewProps={{ ...viewProps, style: [style, viewProps?.style] }}
      {...props}
    >
      {children}
    </SolitoLink>
  );
});
