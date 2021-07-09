import React from 'react';
import { TouchableOpacity } from 'react-native';

import { createBox } from '../utils/createBox';

export const Card = createBox(TouchableOpacity);

export type Props = React.ComponentProps<typeof Card>;

Card.defaultProps = {
  bg: 'shapeBg',
  activeOpacity: 0.5,
  borderWidth: 1,
  borderColor: 'border',
};
