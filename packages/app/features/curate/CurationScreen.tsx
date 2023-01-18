import { H1, P } from 'app/ui/typography';
import { Box } from 'app/ui/layout/Box';

export const CurationScreen: React.FC = () => {
  return (
    <Box className="flex-1 items-center justify-center p-3">
      <H1>Curate</H1>
      <P className="text-center">Curation screen</P>
    </Box>
  );
};
