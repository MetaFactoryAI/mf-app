import { Stack } from 'expo-router';

import { UserDetailScreen, useParam } from 'app/features/user/UserDetailScreen';

export default function UserDetail() {
  const [user] = useParam('username');

  return (
    <>
      <Stack.Screen
        options={{
          title: user,
        }}
      />
      <UserDetailScreen />
    </>
  );
}
