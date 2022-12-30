import { SecondScreen } from 'app/features/home/SecondScreen';
import { useParam } from 'app/features/user/UserDetailScreen';
import { Stack } from 'expo-router';

export default function Posts() {
  const [user] = useParam('user');

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
