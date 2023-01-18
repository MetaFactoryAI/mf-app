import { H1, P } from 'app/ui/typography';
import { Box } from 'app/ui/layout/Box';

type SecondScreenProps = {
  title?: string;
};
export const SecondScreen: React.FC<SecondScreenProps> = ({ title }) => {
  return (
    <Box className="flex-1 items-center justify-center">
      <H1>Second Screen</H1>
      <P className="text-center">{title}</P>
    </Box>
  );
};
