import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { HomeScreen } from '../screens/Home';
import { ProposalScreen } from '../screens/Proposal';
import { StackPreset } from './constants';
import { MainStackParams, Screen } from './types';

const Stack = createNativeStackNavigator<MainStackParams>();

export const MainStackNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={StackPreset}>
    <Stack.Screen
      name={Screen.HOME}
      component={HomeScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen name={Screen.PROPOSAL} component={ProposalScreen} />
  </Stack.Navigator>
);
