import { H1, P, A, TextLink } from 'app/ui/typography';
import { Box, Row } from 'app/ui/layout';
import { useColorScheme } from 'nativewind';
import { Button } from 'app/ui/Button';
import { RetroButton } from 'app/ui/RetroButton';
import { ConnectWalletButton } from 'app/lib/ConnectWalletButton';

export const HomeScreen: React.FC = () => {
  const { colorScheme, toggleColorScheme } = useColorScheme();

  return (
    <Box className="flex-1 items-center justify-center p-3">
      <H1>Welcome to Universal Dapp</H1>
      <Box className="max-w-xl">
        <P className="text-center">
          Here is a basic starter to show you how you can navigate from one
          screen to another. This screen uses the same code on Next.js and React
          Native.
        </P>
        <P className="text-center">
          Universal Dapp is made by{' '}
          <A
            href="https://twitter.com/META_DREAMER"
            hrefAttrs={{
              target: '_blank',
              rel: 'noreferrer',
            }}
          >
            METADREAMER
          </A>
          .
        </P>
        <ConnectWalletButton />
        <Button className="mt-4" title={`Primary Button`} />
        <RetroButton className="mt-4" title={`Retro Button`} />
        <Button
          className="mt-4"
          intent="secondary"
          title={`Toggle Theme (${colorScheme})`}
          onPress={toggleColorScheme}
        />
      </Box>
      <Box className="h-[32px]" />
      <Row>
        <TextLink href="/fernando">Regular Link</TextLink>
        <Box className="w-[32px]" />
      </Row>
    </Box>
  );
};
