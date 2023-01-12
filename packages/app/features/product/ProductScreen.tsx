import { createParam } from 'solito';
import { H1, H3 } from 'app/ui/typography';
import { Box } from 'app/ui/layout';
import { useProductDetail } from 'app/hooks/products';

export const { useParam } = createParam<{ productId: string }>();

export function ProductScreen() {
  const [productId] = useParam('productId');
  const product = useProductDetail(productId);

  return (
    <Box className="flex-1 items-center justify-center p-3">
      {product.isLoading ? (
        <H3>Loading...</H3>
      ) : (
        <>
          <H1>{product.data?.name}</H1>
          <H3>{product.data?.description}</H3>
        </>
      )}
    </Box>
  );
}
