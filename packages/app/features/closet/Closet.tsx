import { createParam } from 'solito';
import { H3, TextLink } from 'app/ui/typography';
import { Box } from 'app/ui/layout/Box';

export const { useParam } = createParam<{ username: string }>();

export function ClosetScreen() {
  const [username] = useParam('username');

  return (
    <Box className="flex-1 items-center justify-center p-3">
      <H3>{`Username: ${username}`}</H3>

      <TextLink href="/">👈 Go Home</TextLink>
      <TextLink href={`/u/${username}/posts`}>Go to Posts</TextLink>
    </Box>
  );
}
