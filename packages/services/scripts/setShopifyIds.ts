import { createClient } from '../mfos';
import { MFOS_GRAPHQL_TOKEN } from 'shared/config/secret';
import { MFOS_GRAPHQL_URL } from 'shared/config/public';
import { fileSelector } from '../mfos/files/selectors';
import { getShopProducts } from '../shopify/queries';
import { nodeIdToProductId } from '../shopify/utils';

const mfosClient = createClient(MFOS_GRAPHQL_URL, MFOS_GRAPHQL_TOKEN);

async function setShopifyIds(): Promise<void> {
  const data = await mfosClient('query')({
    products: [
      {
        filter: {
          shopify_id: { _null: true },
        },
      },
      {
        id: true,
        name: true,
        description: true,
        images: [
          {},
          {
            id: true,
            directus_files_id: [{}, fileSelector],
          },
        ],
      },
    ],
  });
  const products = data.products || [];

  const missingProducts = [];

  for (let i = 0; i < products.length; i += 1) {
    const { id, name } = products[i];
    if (id) {
      const shopProducts = await getShopProducts({
        query: `title:${name}`,
        first: 5,
      });
      if (shopProducts.length > 1) {
        console.log(
          `Found multiple shopify products for ${name}`,
          shopProducts,
        );
      } else if (shopProducts.length === 0) {
        console.log(`No shopify product found for ${name}`);
        missingProducts.push({ id, name });
      } else {
        const shopProduct = shopProducts[0];
        console.log(`Found shopify product for ${name}`, shopProduct);
        await mfosClient('mutation')({
          update_products_item: [
            {
              id,
              data: { shopify_id: nodeIdToProductId(shopProduct.id) },
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

  console.log('Missing products', JSON.stringify(missingProducts, null, 2));
}

setShopifyIds();
