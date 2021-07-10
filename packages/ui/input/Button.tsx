import { createRestyleComponent, createVariant } from '@shopify/restyle';
import * as React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

import { Theme } from '../theme';
import { Color, FontSize, FontWeight } from '../types';
import { StyledText } from '../typography/StyledText';
import { boxRestyleFunctions, BoxStyleProps } from '../utils/createBox';
import { Spinner } from './Spinner';

type StyleProps = BoxStyleProps & { variant?: keyof Theme['buttonVariants'] };

type BaseButtonProps = StyleProps &
  Omit<TouchableOpacityProps, keyof StyleProps> & {
    children?: React.ReactNode;
  };

const restyleFunctions = [
  ...boxRestyleFunctions,
  createVariant<Theme, 'buttonVariants'>({
    themeKey: 'buttonVariants',
    defaults: {
      flexDirection: 'row',
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'button',
      alignSelf: {
        mobile: 'flex-start',
        desktop: 'center',
      },
      overflow: 'hidden',
      px: 's',
      py: 'xs',
    },
  }),
];

export const BaseButton = createRestyleComponent<BaseButtonProps, Theme>(
  restyleFunctions,
  TouchableOpacity,
);

BaseButton.defaultProps = {
  variant: 'base',
};

export type Props = BaseButtonProps & {
  color?: Color;
  showSpinner?: boolean;
  title?: string;
  fontSize?: FontSize;
  fontWeight?: FontWeight;
  solid?: boolean;
  bordered?: boolean;
  secondary?: boolean;
};

export const Button = React.memo<Props>(
  ({
    title,
    fontSize = 'm',
    color: propsColor = 'buttonPrimary',
    showSpinner,
    solid,
    secondary,
    fontWeight = secondary ? 'medium' : 'semiBold',
    ...props
  }) => {
    let buttonColor = propsColor;

    if (secondary) buttonColor = 'buttonSecondary';

    let textColor: Color = solid ? 'buttonSolidContent' : buttonColor;

    if (props.disabled) {
      buttonColor = 'buttonDisabled';
      textColor = 'disabledContent';
    }

    return (
      <BaseButton
        borderColor={buttonColor}
        activeOpacity={props.onPress ? 0.4 : 1}
        {...(solid && {
          borderWidth: 0,
          bg: buttonColor,
        })}
        {...props}
      >
        {title ? (
          <StyledText
            mr={showSpinner ? 's' : 0}
            color={textColor}
            fontSize={fontSize}
            lineHeight={undefined}
            fontWeight={fontWeight}
            textAlign="center"
            {...(props.variant === 'pill' && {
              fontSize: 's',
              fontWeight: 'semiBold',
            })}
          >
            {title}
          </StyledText>
        ) : null}
        {showSpinner ? <Spinner color={textColor} /> : null}
      </BaseButton>
    );
  },
);
