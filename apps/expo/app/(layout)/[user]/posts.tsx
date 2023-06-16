import { Stack } from 'expo-router';

import { SecondScreen } from 'app/features/home/SecondScreen';
import { useParam } from 'app/features/user/UserDetailScreen';

export default function Posts() {
  const [user] = useParam('username');

  return (
    <>
      <Stack.Screen
        options={{
          title: `${user}'s Posts`,
        }}
      />
      <SecondScreen title={`Posts by ${user}`} />
    </>
  );
}
