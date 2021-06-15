import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import { HomeScreen } from '../screens/Home';
import { ProposalScreen } from '../screens/Proposal';
import { MainStackParams, Screen } from './types';

const Stack = createStackNavigator<MainStackParams>();

export const MainStackNavigator: React.FC = () => (
  <Stack.Navigator>
    <Stack.Screen name={Screen.HOME} component={HomeScreen} />
    <Stack.Screen name={Screen.PROPOSAL} component={ProposalScreen} />
  </Stack.Navigator>
);