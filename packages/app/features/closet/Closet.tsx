import { createParam } from 'solito';
import { H3, TextLink } from 'app/ui/typography';
import { Box } from 'app/ui/layout/Box';
import { api } from 'app/lib/api';

export const { useParam } = createParam<{ username: string }>();

export function ClosetScreen() {
  const [username] = useParam('username');
  const { data, isLoading } = api.claims.wearableMerkleClaims.useQuery();

  return (
    <Box className="flex-1 items-center justify-center p-3">
      <H3>{`Username: ${username}`}</H3>

      <TextLink href="/">👈 Go Home</TextLink>
      <TextLink href={`/u/${username}/posts`}>Go to Posts</TextLink>
    </Box>
  );
}
