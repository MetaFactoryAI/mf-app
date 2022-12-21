import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { ModalPreset } from './constants';
import { MainStackNavigator } from './MainStackNavigator';
import { RootStackParams, Screen } from './types';

const Stack = createNativeStackNavigator<RootStackParams>();

export const RootNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={ModalPreset}>
    <Stack.Screen name={Screen.MAIN_STACK} component={MainStackNavigator} />
  </Stack.Navigator>
);
