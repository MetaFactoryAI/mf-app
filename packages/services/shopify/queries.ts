import { shopifyClient } from './client';
import { shopifyProductSelector } from './selectors';

type GetProductsParams = {
  first?: number;
  after?: string;
  query?: string;
  reverse?: boolean;
};

const DEFAULT_PARAMS: GetProductsParams = {
  first: 10,
  reverse: true,
};

export const getShopProducts = async (params: GetProductsParams) => {
  try {
    const data = await shopifyClient('query')({
      products: [
        { ...DEFAULT_PARAMS, ...params },
        {
          edges: {
            node: shopifyProductSelector,
          },
        },
      ],
    });

    return data.products.edges.map((edge) => edge.node);
  } catch (error) {
    console.error(error);
    return [];
  }
};
