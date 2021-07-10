import * as React from 'react';

import { createBox } from '../utils/createBox';

const BaseSeparator = createBox();

type Props = React.ComponentProps<typeof BaseSeparator>;

export const Separator: React.FC<Props> = (props) => (
  <BaseSeparator
    borderBottomWidth={1}
    borderColor="border"
    minHeight={1}
    alignSelf="stretch"
    {...props}
  />
);
