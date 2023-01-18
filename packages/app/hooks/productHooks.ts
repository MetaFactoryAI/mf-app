import { mfosClient } from 'app/lib/mfosClient';
import { productsFilesSelector } from 'services/mfos/products/selectors';
import { useQuery } from '@tanstack/react-query';
import { PRODUCT_STAGES, Selector, ValueTypes } from 'services/mfos';
import { fileSelector } from 'services/mfos/files/selectors';

type UseProductsOptions = {
  filter: ValueTypes['products_filter'];
};

export const baseProductsSelector = Selector('products')({
  id: true,
  name: true,
  description: true,
  product_stage: [{}, { name: true, sort: true }],
  shopify_id: true,
  notion_id: true,
});

export const contributorsSelector = Selector('products')({
  brand_id: [
    {},
    {
      id: true,
      name: true,
      eth_address: true,
      logo: [{}, fileSelector],
    },
  ],
  contributors: [
    {},
    {
      id: true,
      contribution_share: true,
      collaborators_id: [
        {},
        {
          id: true,
          role: [{}, { name: true, id: true }],
          display_name: true,
        },
      ],
    },
  ],
});

export const useProducts = (
  { filter }: UseProductsOptions = {
    filter: {
      product_stage: {
        name: {
          _nin: [
            PRODUCT_STAGES.rejected.name,
            PRODUCT_STAGES.fulfillment_completed.name,
          ],
        },
      },
    },
  },
) => {
  return useQuery(['products'], async () => {
    const { products } = await mfosClient('query')(
      {
        products: [
          { filter, limit: 20, sort: ['-created_at'] },
          {
            ...baseProductsSelector,
            ...contributorsSelector,
            ...productsFilesSelector,
          },
        ],
      },
      {
        operationName: 'getActiveProducts',
      },
    );
    return products;
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
            ...baseProductsSelector,
            ...contributorsSelector,
            ...productsFilesSelector,
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
