import { createParam } from 'solito';
import { H1, H3, P } from 'app/ui/typography';
import { useProductDetail } from 'app/hooks/productHooks';
import { Box } from 'app/ui/layout/Box';

export const { useParam } = createParam<{ productId: string }>();

export function ProductScreen() {
  const [productId] = useParam('productId');
  const product = useProductDetail(productId);

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
