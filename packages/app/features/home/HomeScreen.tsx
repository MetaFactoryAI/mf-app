import { H1, P, TextLink } from 'app/ui/typography';
import { Box, Row } from 'app/ui/layout';
import { Button } from 'app/ui/Button';
import { RetroButton } from 'app/ui/RetroButton';

export const HomeScreen: React.FC = () => {
  return (
    <Box className="flex-1 items-center justify-center p-3">
      <H1>Welcome to MetaFactory</H1>
      <Box className="max-w-xl">
        <P className="text-center">
          Here is a basic starter to show you how you can navigate from one
          screen to another.
        </P>
        <Button className="mt-4" title={`Primary Button`} />
        <RetroButton className="mt-4" title={`Retro Button`} />
      </Box>
      <Box className="h-[32px]" />
      <Row>
        <TextLink href="/metadreamer">Regular Link</TextLink>
        <Box className="w-[32px]" />
      </Row>
    </Box>
  );
};
