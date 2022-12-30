import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="[user]/index" options={{ title: 'User' }} />
      <Stack.Screen
        name="settings"
        options={{ presentation: 'modal', title: 'Settings' }}
      />
    </Stack>
  );
}
