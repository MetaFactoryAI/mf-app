import { MFOS_GRAPHQL_URL } from 'shared/config/public';
import { MFOS_GRAPHQL_TOKEN } from 'shared/config/secret';

import { createClient } from '../mfos';
import { nodeIdToProductId } from '../shopify/utils';

const mfosClient = createClient(MFOS_GRAPHQL_URL, MFOS_GRAPHQL_TOKEN);

async function removePrefixFromShopifyId(): Promise<void> {
  const data = await mfosClient('query')({
    products: [
      {
        filter: {
          shopify_id: { _nempty: true },
        },
      },
      {
        id: true,
        name: true,
        shopify_id: true,
      },
    ],
  });
  const products = data.products || [];

  for (let i = 0; i < products.length; i += 1) {
    const { id, name, shopify_id } = products[i];
    if (id && shopify_id) {
      await mfosClient('mutation')({
        update_products_item: [
          {
            id,
            data: { shopify_id: nodeIdToProductId(shopify_id) },
          },
          {
            id: true,
            shopify_id: true,
          },
        ],
      });
      console.log(`Updated ${name} Successfully!`);
    }
  }
}

removePrefixFromShopifyId();
