import {
  CompositeNavigationProp,
  NavigationContainer,
  NavigationProp,
  ParamListBase,
  RouteProp as RoutePropBase,
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

export const createMockNavigator = <
  T extends NavigationProp<ParamListBase>,
>() =>
  ({
    setOptions: jest.fn(),
    navigate: jest.fn(),
    goBack: jest.fn(),
  } as unknown as T);

const createMockRoute = <Screen extends keyof ParamListBase>() =>
  ({
    params: {},
    name: '',
    key: 'Screen Key',
  } as unknown as RoutePropBase<ParamListBase, Screen>);

type ScreenProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: CompositeNavigationProp<any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: RoutePropBase<ParamListBase, any>;
};

export const createMockNavProps = <Props extends ScreenProps>(): {
  navigation: Props['navigation'];
  route: Props['route'];
} => ({
  navigation: createMockNavigator(),
  route: createMockRoute(),
});

const { Screen, Navigator } = createStackNavigator();

export const MockNavigator: React.FC<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
}> = ({ component }) => (
  <NavigationContainer>
    <Navigator>
      <Screen name="Mock Screen" component={component} />
    </Navigator>
  </NavigationContainer>
);
