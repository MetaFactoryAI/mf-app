import 'react-native-gesture-handler';

import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { Text } from 'react-native';

import { linking } from './navigation/linking';
import { RootNavigator } from './navigation/RootNavigator';

const App: React.FC = () => (
  <NavigationContainer linking={linking} fallback={<Text>Loading...</Text>}>
    <RootNavigator />
  </NavigationContainer>
);

// eslint-disable-next-line import/no-default-export
export default App;
