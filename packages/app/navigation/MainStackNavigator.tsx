import { PageContainer } from '@mf/components/PageContainer';
import { createStackNavigator } from '@react-navigation/stack';
import React, { Suspense } from 'react';

import { StackPreset } from './constants';
import { MainStackParams, Screen } from './types';

const HomeScreen = React.lazy(() => import('../screens/Home'));
const ProposalScreen = React.lazy(() => import('../screens/Proposal'));

const Stack = createStackNavigator<MainStackParams>();

export const MainStackNavigator: React.FC = () => (
  <Suspense fallback={<PageContainer />}>
    <Stack.Navigator screenOptions={StackPreset}>
      <Stack.Screen name={Screen.HOME} component={HomeScreen} />
      <Stack.Screen name={Screen.PROPOSAL} component={ProposalScreen} />
    </Stack.Navigator>
  </Suspense>
);
