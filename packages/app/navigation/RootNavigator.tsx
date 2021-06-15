import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import { ModalPreset } from './constants';
import { MainStackNavigator } from './MainStackNavigator';
import { RootStackParams, Screen } from './types';

const Stack = createStackNavigator<RootStackParams>();

export const RootNavigator: React.FC = () => (
  <Stack.Navigator mode="modal" screenOptions={ModalPreset}>
    <Stack.Screen name={Screen.MAIN_STACK} component={MainStackNavigator} />
  </Stack.Navigator>
);
