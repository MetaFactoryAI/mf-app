import 'react-native-gesture-handler/jestSetup';

// From https://reactnavigation.org/docs/testing/

jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment
  const Reanimated = require('react-native-reanimated/mock');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  Reanimated.default.call = () => {};

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return Reanimated;
});

jest.mock('react-native/Libraries/Animated/src/NativeAnimatedHelper');

jest.mock('expo-linking');

jest.mock('@react-navigation/stack', () => ({
  ...jest.requireActual('@react-navigation/stack'),
  useHeaderHeight: () => 48,
}));

jest.useFakeTimers();
Date.now = jest.fn(() => 1625901000000);
