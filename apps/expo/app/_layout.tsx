import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Tabs, RootContainer } from 'expo-router';
import { useColorScheme } from 'react-native';

import { Provider } from 'app/provider';

export default function _layout() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const colorMode = useColorScheme();
  return (
    <Provider>
      <RootContainer theme={colorMode === 'dark' ? DarkTheme : DefaultTheme} />
      <Tabs>
        <Tabs.Screen
          name="(layout)"
          options={{ headerShown: false, title: 'Home' }}
        />
        <Tabs.Screen name="second" options={{ title: 'Second' }} />
      </Tabs>
    </Provider>
  );
}
