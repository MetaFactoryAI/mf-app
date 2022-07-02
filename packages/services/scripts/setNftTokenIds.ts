import { createClient } from '../mfos';
import { CONFIG } from '../utils/config';

const client = createClient(CONFIG.mfosGraphqlUrl, CONFIG.mfosGraphqlToken);

async function setNftTokenIds(): Promise<void> {
  const data = await client('query')({
    products: [
      {
        filter: {
          wearable_files_func: { count: { _gt: 0 } },
          shopify_id: { _nempty: true },
        },
        sort: ['nft_token_id', 'shopify_id'],
      },
      {
        id: true,
        nft_token_id: true,
      },
    ],
  });

  const products = data.products || [];

  for (let i = 0; i < products.length; i += 1) {
    const { id } = products[i];
    if (id) {
      await client('mutation')({
        update_products_item: [
          {
            id,
            data: { nft_token_id: i + 1 },
          },
          { nft_token_id: true, name: true },
        ],
      });
    }
  }
}

setNftTokenIds();
