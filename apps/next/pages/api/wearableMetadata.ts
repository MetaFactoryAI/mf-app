/* eslint-disable @typescript-eslint/ban-ts-comment,no-await-in-loop */
import { VercelRequest, VercelResponse } from '@vercel/node';

import { getNotionProducts } from 'services/lib/notionHelpers';
import { setNftTokenIds } from 'services/lib/setNftTokenIds';
import {
  getProductShopifyId,
  getProductTitle,
} from 'services/utils/notion/productHelpers';
import {
  generateWearableMetadata,
  updateProduct,
} from 'services/utils/wearableHelpers';

export default async (
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> => {
  try {
    const products = await getNotionProducts({
      and: [
        {
          property: 'Wearable Files',
          files: { is_not_empty: true },
        },
        {
          property: 'Shopify Link',
          url: { is_not_empty: true },
        },
      ],
    });
    const itemResults = [];

    for (const p of products) {
      const title = getProductTitle(p);

      const metadata = await generateWearableMetadata(p);
      const shopifyId = getProductShopifyId(p);
      if (shopifyId) {
        const setDataRes = await updateProduct(shopifyId, {
          notion_id: p.id,
          title,
          nft_metadata: metadata,
        });
        itemResults.push(setDataRes?.returning);
      }
    }
    await setNftTokenIds();
    res.status(200).send(itemResults);
  } catch (e) {
    res.status(500).send(e);
  }
};
