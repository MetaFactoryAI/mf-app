import { Provider } from 'app/provider';
import { Tabs, RootContainer } from 'expo-router';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from 'react-native';

export default function _layout() {
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
