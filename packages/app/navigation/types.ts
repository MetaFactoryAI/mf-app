import {
  CompositeNavigationProp,
  NavigatorScreenParams,
  RouteProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export enum Screen {
  HOME = 'Home',
  PROPOSAL = 'Proposal',
  MAIN_STACK = 'Main Stack',
}

export type RootStackParams = {
  [Screen.MAIN_STACK]: NavigatorScreenParams<MainStackParams>;
};

export type MainStackParams = {
  [Screen.HOME]: undefined;
  [Screen.PROPOSAL]: {
    proposalId: string;
  };
};

export type RootStackNavigationProps<Screen extends keyof RootStackParams> =
  NativeStackNavigationProp<RootStackParams, Screen>;

export type MainStackNavigationProps<Screen extends keyof MainStackParams> =
  CompositeNavigationProp<
    NativeStackNavigationProp<MainStackParams, Screen>,
    RootStackNavigationProps<Screen.MAIN_STACK>
  >;

export type MainStackScreenProps<Screen extends keyof MainStackParams> = {
  navigation: MainStackNavigationProps<Screen>;
  route: RouteProp<MainStackParams, Screen>;
};
