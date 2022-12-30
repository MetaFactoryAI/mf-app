import { UserDetailScreen, useParam } from 'app/features/user/UserDetailScreen';
import { Stack } from 'expo-router';

export default function UserDetail() {
  const [user] = useParam('user');

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
