import { createParam } from 'solito';
import { H1, H3, P } from 'app/ui/typography';
import { Box } from 'app/ui/layout/Box';
import { api } from 'app/lib/api';

export const { useParam } = createParam<{ productId: string }>();

export function ProductScreen() {
  const [productId] = useParam('productId');
  const product = api.product.byId.useQuery(productId, {
    enabled: !!productId,
  });

  return (
    <Box className="container flex-1 items-center justify-center p-3">
      {product.isLoading ? (
        <H3>Loading...</H3>
      ) : (
        <>
          <H1>{product.data?.name}</H1>
          <P>{product.data?.description}</P>
        </>
      )}
    </Box>
  );
}
