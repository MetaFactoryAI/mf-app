import { ScrollView } from 'react-native';

import { createBox } from '../utils/createBox';

export const ScrollContainer = createBox(ScrollView);

ScrollContainer.defaultProps = {
  showsVerticalScrollIndicator: false,
  width: '100%',
};
