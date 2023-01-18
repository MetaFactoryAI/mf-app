import { H1, P } from 'app/ui/typography';
import { Box } from 'app/ui/layout/Box';

export const ShopScreen: React.FC = () => {
  return (
    <Box className="flex-1 items-center justify-center p-3">
      <H1>Shop</H1>
      <P className="text-center">Shop screen</P>
    </Box>
  );
};
