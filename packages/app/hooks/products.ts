import { mfosClient } from 'app/lib/mfosClient';
import { productNftMetadataSelector } from 'services/mfos/products/selectors';
import { useQuery } from '@tanstack/react-query';
import { PRODUCT_STAGES, ValueTypes } from 'services/mfos';

export const useProducts = (
  filter: ValueTypes['products_filter'] = {
    product_stage: {
      name: {
        _nin: [
          PRODUCT_STAGES.rejected.name,
          PRODUCT_STAGES.fulfillment_completed.name,
        ],
      },
    },
  },
) => {
  return useQuery(['products'], () => {
    return mfosClient('query')(
      {
        products: [
          { filter, limit: 20 },
          {
            ...productNftMetadataSelector,
            sale_price: true,
          },
        ],
      },
      {
        operationName: 'getActiveProducts',
      },
    );
  });
};

export const useProductDetail = (productId?: string) => {
  return useQuery(['product', productId], async () => {
    if (!productId) return null;

    const { products_by_id } = await mfosClient('query')(
      {
        products_by_id: [
          { id: productId },
          {
            ...productNftMetadataSelector,
            sale_price: true,
          },
        ],
      },
      {
        operationName: 'getProductDetail',
      },
    );

    return products_by_id;
  });
};
