import { createParam } from 'solito';
import { H3, TextLink } from 'app/ui/typography';
import { Box } from 'app/ui/layout';

export const { useParam } = createParam<{ user: string }>();

export function UserDetailScreen() {
  const [user] = useParam('user');

  return (
    <Box className="flex-1 items-center justify-center p-3">
      <H3>{`User ID: ${user}`}</H3>

      <TextLink href="/">👈 Go Home</TextLink>
      <TextLink href={`/${user}/posts`}>Go to Posts</TextLink>
    </Box>
  );
}
