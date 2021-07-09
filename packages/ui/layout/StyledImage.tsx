import * as React from 'react';
import { Image } from 'react-native';

import { createBox } from '../utils/createBox';

export const StyledImage = createBox(Image);

export type Props = React.ComponentProps<typeof StyledImage>;
