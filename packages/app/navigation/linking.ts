import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';

import { Screen } from './types';

const prefix = Linking.createURL('/');
export const linking: LinkingOptions = {
  prefixes: [prefix],
  config: {
    screens: {
      [Screen.MAIN_STACK]: {
        initialRouteName: Screen.HOME,
        path: '',
        screens: {
          [Screen.HOME]: '',
          [Screen.PROPOSAL]: 'proposal/:proposalId',
        },
      },
    },
  },
};
