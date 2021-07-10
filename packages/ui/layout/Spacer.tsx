import * as React from 'react';

import { createBox } from '../utils/createBox';

const BaseSeparator = createBox();

type Props = React.ComponentProps<typeof BaseSeparator>;

export const Spacer: React.FC<Props> = (props) => (
  <BaseSeparator alignSelf="stretch" px="m" py="s" {...props} />
);
